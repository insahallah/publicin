import React from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Linking,
  useColorScheme,
} from 'react-native';

const TermsOfService = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <ScrollView contentContainerStyle={[styles.container, isDark && { backgroundColor: '#000' }]}>
      <Text style={[styles.heading, isDark && styles.headingDark]}>Terms of Service</Text>
      <Text style={styles.date}><Text style={styles.bold}>Effective Date:</Text> January 1, 2025</Text>

      <Section title="1. Acceptance of Terms">
        <Text style={styles.paragraph}>
          By accessing or using our mobile application (“App”), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
        </Text>
      </Section>

      <Section title="2. Eligibility">
        <Text style={styles.paragraph}>
          You must be at least 13 years old (or 16 in some regions) to use this App. By using the App, you represent and warrant that you meet the age requirement and have the authority to enter into this agreement.
        </Text>
      </Section>

      <Section title="3. Account Responsibilities">
        <Bullet text="You are responsible for maintaining the confidentiality of your account credentials." />
        <Bullet text="You agree to provide accurate and complete information." />
        <Bullet text="You are responsible for all activities under your account." />
      </Section>

      <Section title="4. Prohibited Activities">
        <Bullet text="Using the App for any unlawful or fraudulent purpose." />
        <Bullet text="Posting offensive, obscene, or defamatory content." />
        <Bullet text="Infringing on any third party’s rights." />
        <Bullet text="Attempting to reverse-engineer or interfere with the App’s functionality or servers." />
      </Section>

      <Section title="5. Intellectual Property">
        <Text style={styles.paragraph}>
          All content, trademarks, logos, and software associated with the App are the property of the Company or its licensors and protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without prior written consent.
        </Text>
      </Section>

      <Section title="6. Termination">
        <Text style={styles.paragraph}>
          We reserve the right to suspend or terminate your access to the App at any time, with or without notice, for conduct that we believe violates these Terms, is harmful to other users, or is otherwise deemed inappropriate.
        </Text>
      </Section>

      <Section title="7. Disclaimers">
        <Text style={styles.paragraph}>
          The App is provided “as is” and “as available.” We make no warranties, express or implied, about the availability, reliability, or accuracy of the App. Use of the App is at your own risk.
        </Text>
      </Section>

      <Section title="8. Limitation of Liability">
        <Text style={styles.paragraph}>
          To the maximum extent permitted by law, the Company shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App.
        </Text>
      </Section>

      <Section title="9. Modifications to Terms">
        <Text style={styles.paragraph}>
          We reserve the right to update or modify these Terms at any time. If material changes are made, we will notify you through the App or via email. Continued use of the App after changes indicates acceptance.
        </Text>
      </Section>

      <Section title="10. Governing Law">
        <Text style={styles.paragraph}>
          These Terms shall be governed by and construed in accordance with the laws of [Your Country or State], without regard to its conflict of law principles.
        </Text>
      </Section>

      <Section title="11. Contact Us">
        <Text style={styles.paragraph}>
          For questions or concerns regarding these Terms, contact us at:
        </Text>
        <Text style={styles.paragraph}>
          Email:{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('mailto:publicsewa@gmail.com')}
          >
            publicsewa@gmail.com
          </Text>
          {'\n'}Address: Giridih Jharkhand
        </Text>
      </Section>
    </ScrollView>
  );
};

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.subheading}>{title}</Text>
    {children}
  </View>
);

const Bullet = ({ text }) => (
  <Text style={styles.bullet}>{'\u2022'} {text}</Text>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
  },
  headingDark: {
    color: '#fff',
  },
  date: {
    fontSize: 14,
    marginBottom: 20,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  bullet: {
    fontSize: 16,
    marginBottom: 6,
    color: '#444',
    paddingLeft: 10,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
  },
  bold: {
    fontWeight: 'bold',
  },
  link: {
    color: '#1e90ff',
    textDecorationLine: 'underline',
  },
});

export default TermsOfService;
