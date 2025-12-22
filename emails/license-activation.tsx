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

interface LicenseActivationEmailProps {
  email: string;
  activationUrl: string;
  adminName: string;
}

export const LicenseActivationEmail = ({
  email,
  activationUrl,
  adminName,
}: LicenseActivationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Buda Hive license has been activated! 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <div style={logoContainer}>
              <div style={logo}>B</div>
              <Text style={logoText}>Buda Hive</Text>
            </div>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>Welcome to Buda Hive! 🎉</Heading>
            
            <Text style={text}>
              Great news! Your Buda Hive business platform license has been activated by {adminName}.
            </Text>

            <Text style={text}>
              You now have access to your AI-powered business coach that will help you grow your business with personalized guidance, insights, and support.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={activationUrl}>
                Activate Your Account
              </Button>
            </Section>

            <Text style={text}>
              Or copy and paste this URL into your browser:
            </Text>
            <Text style={linkText}>
              <Link href={activationUrl} style={link}>
                {activationUrl}
              </Link>
            </Text>

            {/* Next Steps */}
            <Section style={stepsContainer}>
              <Heading style={h2}>Next Steps:</Heading>
              <Text style={stepText}>
                <strong>1.</strong> Click the activation button above to verify your email
              </Text>
              <Text style={stepText}>
                <strong>2.</strong> Download the Buda Hive app from your app store
              </Text>
              <Text style={stepText}>
                <strong>3.</strong> Sign in with this email address: <strong>{email}</strong>
              </Text>
              <Text style={stepText}>
                <strong>4.</strong> Complete your business profile to unlock all features
              </Text>
              <Text style={stepText}>
                <strong>5.</strong> Start chatting with your AI business coach!
              </Text>
            </Section>

            {/* Features */}
            <Section style={featuresContainer}>
              <Heading style={h2}>What You Get:</Heading>
              <Text style={featureText}>✨ 24/7 AI Business Coach</Text>
              <Text style={featureText}>📊 Business Analytics & Insights</Text>
              <Text style={featureText}>💡 Personalized Growth Strategies</Text>
              <Text style={featureText}>🎯 Goal Tracking & Accountability</Text>
              <Text style={featureText}>📚 Business Resources & Templates</Text>
            </Section>

            <Text style={text}>
              Need help getting started? Our support team is here for you at{' '}
              <Link href="mailto:cs@moilapp.com" style={link}>
                cs@moilapp.com
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Powered by Moil • Sponsored by Buda Economic Development Corporation
            </Text>
            <Text style={footerText}>
              This email was sent to {email} because a Buda Hive license was assigned to you.
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
