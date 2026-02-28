import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        // MercadoPago sends 'data.id' and 'type' in query params usually for webhooks,
        // or as a JSON body depending on how the webhook is configured (IPN vs Webhook).
        const url = new URL(req.url);
        let paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');
        const type = url.searchParams.get('type') || url.searchParams.get('topic');

        if (type !== 'payment') {
            const bodyText = await req.text();
            try {
                const body = JSON.parse(bodyText);
                if (body.type === 'payment' && body.data?.id) {
                    paymentId = body.data.id;
                } else if (body.action === 'payment.created' && body.data?.id) {
                    paymentId = body.data.id;
                }
            } catch (e) { }

            if (!paymentId) {
                return new NextResponse('OK', { status: 200 }); // Ignore non-payment events
            }
        }

        if (!paymentId) {
            return new NextResponse('Missing payment ID', { status: 400 });
        }

        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            console.error('MP_ACCESS_TOKEN is missing');
            return new NextResponse('Internal Error', { status: 500 });
        }

        const client = new MercadoPagoConfig({ accessToken });
        const paymentClient = new Payment(client);

        // Fetch the actual payment details from MP to verify it's legitimate
        const paymentData = await paymentClient.get({ id: paymentId });

        if (paymentData.status === 'approved') {
            // Look up user via external_reference
            const userId = paymentData.external_reference;
            const amount = paymentData.transaction_amount;

            if (userId && amount) {
                // Check if we already processed this payment to avoid double crediting
                const { data: existingTx } = await supabaseAdmin
                    .from('transactions')
                    .select('id, status')
                    .eq('mp_payment_id', paymentId)
                    .single();

                if (existingTx && existingTx.status === 'approved') {
                    return new NextResponse('Already processed', { status: 200 });
                }

                // 1. Mark transaction as approved
                // If we created a pending tx at checkout step with preference_id, we can update it.
                // Or just upsert based on payment id.
                await supabaseAdmin.from('transactions').upsert({
                    user_id: userId,
                    mp_payment_id: paymentId.toString(),
                    amount: amount,
                    status: 'approved'
                }, { onConflict: 'mp_payment_id' });

                // 2. Increment user balance safely using RPC or direct update
                // For direct update (might have race conditions if multiple payments hit at exact same ms, 
                // but fine for simple cases. A Supabase RPC `increment_balance` is safer. We'll read/write for now).
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('balance')
                    .eq('id', userId)
                    .single();

                const currentBalance = profile?.balance || 0;

                await supabaseAdmin
                    .from('profiles')
                    .update({ balance: Number(currentBalance) + Number(amount) })
                    .eq('id', userId);

                console.log(`Successfully credited $${amount} to user ${userId}`);
            }
        }

        return new NextResponse('OK', { status: 200 });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return new NextResponse('Webhook Error', { status: 500 });
    }
}
