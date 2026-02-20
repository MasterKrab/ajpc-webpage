
export const wrapTemplate = (bodyText: string, signatureText: string = 'AJPC') => `
<div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
    <img src="https://academiajuvenil.progcomp.cl/logo.png" style="display: block; margin: 0 auto; width: 200px; height: auto; border:0;" alt="AJPC" />
  </div>
  <div style="padding: 30px; color: #333333; line-height: 1.6; font-size: 16px;">
    ${bodyText}
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
      <p style="margin: 0; color: #666666;">Saludos cordiales,</p>
      <p style="margin: 5px 0 0 0; font-weight: bold; color: #116bb1; font-size: 18px;">${signatureText}</p>
      <p style="margin: 0; color: #1eca6c; font-size: 14px; font-weight: 600;">Academia Juvenil de Programación Competitiva</p>
    </div>
  </div>
  <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999999;">
    <p style="margin: 0;">© ${new Date().getFullYear()} AJPC. Todos los derechos reservados.</p>
    <p style="margin: 5px 0 0 0;"><a href="https://academiajuvenil.progcomp.cl" style="color: #116bb1; text-decoration: none;">academiajuvenil.progcomp.cl</a></p>
  </div>
</div>
`
