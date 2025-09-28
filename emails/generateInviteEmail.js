// Function to generate invite email HTML
const generateInviteEmail = (userName, companyName, inviteLink) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invite Request</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 30px auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0px 0px 10px rgba(0,0,0,0.1);
      }
      .header {
        text-align: center;
        padding-bottom: 20px;
        border-bottom: 1px solid #eeeeee;
      }
      .header h1 {
        margin: 0;
        color: #333333;
      }
      .content {
        padding: 20px 0;
        color: #555555;
        line-height: 1.6;
      }
      .button {
        display: inline-block;
        background-color: #4CAF50;
        color: #ffffff;
        text-decoration: none;
        padding: 12px 20px;
        border-radius: 5px;
        margin-top: 20px;
        font-weight: bold;
      }
      .footer {
        font-size: 12px;
        color: #999999;
        text-align: center;
        margin-top: 30px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>You're Invited!</h1>
      </div>
      <div class="content">
        <p>Hello ${userName},</p>
        <p>You have been invited to join this project in this <strong>${companyName}</strong> on our platform.</p>
        <p>Click the button below to accept the invitation and get started:</p>
        <a href="${inviteLink}" class="button">Accept Invite</a>
        <p>If the button doesn’t work, copy and paste this link into your browser:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <p>Welcome aboard!</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = generateInviteEmail;
