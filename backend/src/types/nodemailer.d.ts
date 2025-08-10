declare module 'nodemailer' {
  interface Transporter {
    sendMail(mail: any): Promise<any>;
  }
  function createTransport(options: any): Transporter;
  export { createTransport, Transporter };
}
