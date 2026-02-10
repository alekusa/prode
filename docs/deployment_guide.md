# Guía de Despliegue en Vercel

Esta guía detalla los pasos para subir el proyecto a producción y mantenerlo actualizado automáticamente.

## 1. Preparación de GitHub
Para que Vercel funcione mejor, el proyecto debe estar en un repositorio de **GitHub** (o GitLab/Bitbucket).
- Una vez que subas el código, cada vez que hagas un `git push`, Vercel detectará el cambio y actualizará el sitio automáticamente.

## 2. Conectar con Vercel
1. Andá a [vercel.com](https://vercel.com) e iniciá sesión con tu cuenta de GitHub.
2. Hacé clic en **"Add New..."** > **"Project"**.
3. Seleccioná el repositorio de este proyecto.

## 3. Configurar Variables de Entorno
En la pantalla de configuración de Vercel, buscá la sección **"Environment Variables"** y agregá las siguientes (copialas de tu archivo `.env.local`):

| Variable | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | https://tu-url.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu-anon-key-larga |

## 4. Deploy!
- Hacé clic en **"Deploy"**.
- Vercel compilará el proyecto y te dará una URL (ej: `loteria-prode.vercel.app`).

## 5. Actualizaciones Continuas
¡Sí! Podés seguir construyendo. 
- Cada vez que terminemos una funcionalidad nueva y la subas a GitHub, Vercel la publicará en segundos.
- No hace falta volver a configurar nada.
