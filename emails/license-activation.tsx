import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface EdcInfo {
  programName: string;
  fullName: string;
  logoInitial: string;
  primaryColor: string;
  supportEmail: string;
  licenseDuration: string;
  jobPosts?: number;
}

interface LicenseActivationEmailProps {
  email: string;
  activationUrl: string;
  adminName: string;
  edc?: EdcInfo;
}

// Default EDC info (Buda Hive)
const defaultEdc: EdcInfo = {
  programName: 'Buda Hive',
  fullName: 'Buda Economic Development Corporation',
  logoInitial: 'B',
  primaryColor: '#1e40af',
  supportEmail: 'cs@moilapp.com',
  licenseDuration: '1 year',
  jobPosts: 3,
};

export const LicenseActivationEmail = ({
  email,
  activationUrl,
  adminName,
  edc = defaultEdc,
}: LicenseActivationEmailProps) => {
  const edcInfo = { ...defaultEdc, ...edc };
  
  // Dynamic styles based on EDC colors
  const dynamicHeader = {
    ...header,
    backgroundColor: edcInfo.primaryColor,
  };
  
  const dynamicButton = {
    ...button,
    backgroundColor: edcInfo.primaryColor,
  };
  
  const dynamicLink = {
    ...link,
    color: edcInfo.primaryColor,
  };

  return (
    <Html>
      <Head />
      <Preview>Welcome to {edcInfo.programName} 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={dynamicHeader}>
            <div style={logoContainer}>
              <div style={logo}>{edcInfo.logoInitial}</div>
              <Text style={logoText}>{edcInfo.programName}</Text>
            </div>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>Welcome to {edcInfo.programName}! 🎉</Heading>
            
            <Text style={text}>
              You're officially in — and we're excited to have you.
            </Text>

            <Text style={text}>
              Thanks to the {edcInfo.fullName} and the {edcInfo.programName} program, 
              you've been granted a <strong>FREE {edcInfo.licenseDuration} license</strong> to 
              Moil's AI-powered Business Coach — built to help you build, grow, and run your 
              business with confidence, no matter your stage or experience level.
            </Text>

            <Text style={text}>
              This isn't another course, spreadsheet, or generic software. Moil is your 
              on-demand AI business partner — available 24/7 — designed specifically for 
              real small businesses.
            </Text>

            {/* What Moil Helps You Achieve */}
            <Section style={stepsContainer}>
              <Heading style={h2}>🚀 What Moil Helps You Achieve</Heading>
              <Text style={stepText}>
                With your {edcInfo.programName} license, you can:
              </Text>
              <Text style={featureText}>• Turn ideas into a clear, actionable business plan</Text>
              <Text style={featureText}>• Generate complete market research and insights from just 21 simple questions</Text>
              <Text style={featureText}>• Get step-by-step help with marketing, pricing, and growth decisions</Text>
              <Text style={featureText}>• Improve cash flow, operations, and time management</Text>
              <Text style={featureText}>• Create strategies, content, and action plans — fast</Text>
              <Text style={featureText}>• Make confident decisions without feeling overwhelmed</Text>
            </Section>

            <Text style={text}>
              You can ask real questions like:
            </Text>
            <Section style={questionBox}>
              <Text style={questionText}>"What should I focus on right now?"</Text>
              <Text style={questionText}>"Am I charging enough?"</Text>
              <Text style={questionText}>"How do I get more customers?"</Text>
              <Text style={questionText}>"What's holding my business back?"</Text>
            </Section>
            <Text style={text}>
              And get clear, practical answers tailored to your business.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Heading style={h2}>✅ Activate Your Account</Heading>
              <Text style={text}>
                Click below to activate your account and get started:
              </Text>
              <Button style={dynamicButton} href={activationUrl}>
                👉 Activate Your {edcInfo.programName} Account
              </Button>
            </Section>

            <Text style={linkText}>
              Or copy and paste this URL into your browser:{' '}
              <Link href={activationUrl} style={dynamicLink}>
                {activationUrl}
              </Link>
            </Text>

            {/* Next Steps */}
            <Section style={stepsContainer}>
              <Heading style={h2}>🧭 Next Steps (Takes ~5 Minutes)</Heading>
              <Text style={stepText}>
                <strong>1.</strong> Click the activation link above
              </Text>
              <Text style={stepText}>
                <strong>2.</strong> Verify your email
              </Text>
              <Text style={stepText}>
                <strong>3.</strong> Sign in using this email address: <strong>{email}</strong>
              </Text>
              <Text style={stepText}>
                <strong>4.</strong> Complete your business profile
              </Text>
              <Text style={stepText}>
                <strong>5.</strong> Start chatting with your AI Business Coach
              </Text>
              <Text style={text}>
                The more you share about your business, the smarter and more useful your coaching becomes.
              </Text>
            </Section>

            {/* Features */}
            <Section style={featuresContainer}>
              <Heading style={h2}>🎁 What You Get With Your {edcInfo.programName} License</Heading>
              <Text style={featureText}>✨ 24/7 AI Business Coach</Text>
              <Text style={featureText}>📊 Complete market research, business insights, and strategy — generated from just 21 questions</Text>
              <Text style={featureText}>💡 Personalized growth, marketing, and pricing guidance</Text>
              <Text style={featureText}>🎯 Goal tracking & accountability</Text>
              {edcInfo.jobPosts && edcInfo.jobPosts > 0 && (
                <Text style={featureText}>📣 Up to {edcInfo.jobPosts} job posts per month to help you hire as your business grows</Text>
              )}
              <Text style={featureText}>📚 Business templates & step-by-step resources</Text>
              <Text style={featureText}>🆓 Full access for {edcInfo.licenseDuration} — provided by the {edcInfo.fullName} & {edcInfo.programName}</Text>
            </Section>

            <Text style={text}>
              If you ever need help getting started or have questions, our support team is here for you at{' '}
              <Link href={`mailto:${edcInfo.supportEmail}`} style={dynamicLink}>
                {edcInfo.supportEmail}
              </Link>
            </Text>

            <Text style={text}>
              You've taken an important step by joining {edcInfo.programName}. 
              Now you have the tools to turn momentum into progress.
            </Text>

            <Text style={closingText}>
              Welcome — we're excited to build with you. 💪
            </Text>
            <Text style={signatureText}>
              The {edcInfo.fullName}, {edcInfo.programName} & Moil Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Powered by Moil • Sponsored by {edcInfo.fullName}
            </Text>
            <Text style={footerText}>
              This email was sent to {email} because a {edcInfo.programName} license was assigned to you.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default LicenseActivationEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#1e40af',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const logoContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
};

const logo = {
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
};

const logoText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0',
};

const content = {
  padding: '40px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  lineHeight: '1.3',
};

const h2 = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
  lineHeight: '1.4',
};

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const stepText = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const featureText = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px',
};

const questionBox = {
  backgroundColor: '#f3f4f6',
  borderLeft: '4px solid #6b7280',
  padding: '16px 20px',
  margin: '16px 0',
};

const questionText = {
  color: '#374151',
  fontSize: '14px',
  fontStyle: 'italic',
  lineHeight: '1.6',
  margin: '0 0 8px',
};

const closingText = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '1.6',
  margin: '24px 0 8px',
};

const signatureText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#1e40af',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
};

const linkText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 24px',
  wordBreak: 'break-all' as const,
};

const link = {
  color: '#1e40af',
  textDecoration: 'underline',
};

const stepsContainer = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const featuresContainer = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const footer = {
  backgroundColor: '#f9fafb',
  padding: '32px 40px',
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};
