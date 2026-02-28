import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// We need MP_ACCESS_TOKEN in env
export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        let accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            throw new Error('MercadoPago Access Token not configured');
        }

        if (accessToken.startsWith('Bearer ')) {
            accessToken = accessToken.replace('Bearer ', '');
        }
        accessToken = accessToken.replace(/['"]/g, '');

        const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
        const preference = new Preference(client);

        const price = 5000;
        const title = 'Carga de Saldo - Prode ($5000)';

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
        const appUrl = siteUrl && siteUrl.startsWith('http') ? siteUrl : 'https://prode-virid.vercel.app';

        const response = await preference.create({
            body: {
                items: [
                    {
                        id: 'saldo-5000',
                        title: title,
                        quantity: 1,
                        unit_price: price,
                        currency_id: 'ARS',
                    }
                ],
                back_urls: {
                    success: `${appUrl}/profile?payment=success`,
                    failure: `${appUrl}/profile?payment=failure`,
                    pending: `${appUrl}/profile?payment=pending`,
                },
                auto_return: 'approved',
                external_reference: userId, // We use external_reference to identify the user
                // Configure webhook inside MP dashboard points to: /api/webhooks/mercadopago
            }
        });

        // We skip saving the 'pending' transaction to the DB here because RLS policies 
        // might reject it depending on the user token vs service role context, and 
        // the webhook will handle creating the 'approved' transaction securely anyway.

        // Return the initialization point (URL) for Checkout Pro
        return NextResponse.json({ init_point: response.init_point });

    } catch (error: any) {
        const errorMsg = error?.message || 'Error desconocido';
        const errorDetails = error?.response?.data || error?.response || error?.cause || null;

        console.error('MercadoPago Checkout Error Details:', errorMsg, errorDetails);

        return NextResponse.json({
            error: errorMsg,
            details: errorDetails
        }, { status: 500 });
    }
}
