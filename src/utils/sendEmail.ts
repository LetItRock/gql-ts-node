import * as SparkPost from 'sparkpost';
const client = new SparkPost(process.env.SPARKPOST_API_KEY, {
  endpoint: 'https://api.eu.sparkpost.com',
});

export const sendEmail = async (recepient: string, url: string) => {
  await client.transmissions.send({
    options: {
      sandbox: true
    },
    content: {
      from: 'testing@sparkpostbox.com',
      subject: 'Confirm email',
      html: `<html>
        <body>
          <p>Testing SparkPost - the world's most awesomest email service!</p>
          <a href="${url}">Confrim email</a>
        </body>
        </html>`
    },
    recipients: [{ address: recepient }]
  });
};
