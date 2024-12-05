import Handlebars from 'handlebars';

const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .content {
      background-color: #f9fafb;
      padding: 20px;
      border-radius: 8px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">QuickFind.lk</div>
    </div>
    <div class="content">
      {{{content}}}
    </div>
    <div class="footer">
      <p>© {{year}} QuickFind.lk. All rights reserved.</p>
      <p>You received this email because you are registered on QuickFind.lk</p>
    </div>
  </div>
</body>
</html>
`;

const welcomeTemplate = `
<h2>Welcome to QuickFind.lk!</h2>
<p>Hi {{name}},</p>
<p>Thank you for joining QuickFind.lk. We're excited to have you as part of our community.</p>
<p>With your account, you can:</p>
<ul>
  <li>Post service advertisements</li>
  <li>Manage your listings</li>
  <li>Connect with potential customers</li>
</ul>
<p>Get started by posting your first advertisement:</p>
<a href="{{postAdUrl}}" class="button">Post Your Ad</a>
`;

const adPostedTemplate = `
<h2>Your Advertisement is Live!</h2>
<p>Hi {{name}},</p>
<p>Your advertisement "{{adTitle}}" has been successfully posted on QuickFind.lk.</p>
<p>You can view your advertisement here:</p>
<a href="{{adUrl}}" class="button">View Advertisement</a>
<p>Your advertisement will be active for 30 days. You can manage your advertisements from your dashboard.</p>
`;

const adExpiringTemplate = `
<h2>Your Advertisement is Expiring Soon</h2>
<p>Hi {{name}},</p>
<p>Your advertisement "{{adTitle}}" will expire in {{daysLeft}} days.</p>
<p>To keep your advertisement active, please renew it from your dashboard:</p>
<a href="{{renewUrl}}" class="button">Renew Advertisement</a>
`;

const inquiryReceivedTemplate = `
<h2>New Inquiry Received</h2>
<p>Hi {{name}},</p>
<p>You have received a new inquiry for your advertisement "{{adTitle}}".</p>
<p><strong>From:</strong> {{inquirerName}}</p>
<p><strong>Contact:</strong> {{inquirerContact}}</p>
<p><strong>Message:</strong></p>
<p>{{message}}</p>
<p>You can view and respond to this inquiry from your dashboard:</p>
<a href="{{inquiryUrl}}" class="button">View Inquiry</a>
`;

// Compile templates
const compileTemplate = (content: string, data: any) => {
  const template = Handlebars.compile(baseTemplate);
  const contentTemplate = Handlebars.compile(content);
  return template({
    content: contentTemplate(data),
    year: new Date().getFullYear(),
  });
};

export const emailTemplates = {
  welcome: (data: any) => compileTemplate(welcomeTemplate, data),
  adPosted: (data: any) => compileTemplate(adPostedTemplate, data),
  adExpiring: (data: any) => compileTemplate(adExpiringTemplate, data),
  inquiryReceived: (data: any) => compileTemplate(inquiryReceivedTemplate, data),
}; 