import React from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Linking,
  useColorScheme,
} from 'react-native';

const PrivacyPolicy = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <ScrollView contentContainerStyle={[styles.container, isDark && { backgroundColor: '#000' }]}>
      <Text style={[styles.heading, isDark && styles.headingDark]}>Privacy Policy</Text>
      <Text style={styles.date}><Text style={styles.bold}>Effective Date:</Text> January 1, 2025</Text>

      <Section title="1. Introduction">
        <Text style={styles.paragraph}>
          We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and disclose information about you when you use our mobile application ("App"). By using the App, you agree to the terms of this policy.
        </Text>
      </Section>

      <Section title="2. Information We Collect">
        <Bullet text="Personal Information: Includes your name, email, phone number, and profile photo submitted during registration or login." />
        <Bullet text="Account Content: Includes listings, posts, images, messages, and any data you submit within the app." />
        <Bullet text="Device Data: Information about the device and network, such as OS version, device model, IP address, mobile carrier, and crash logs." />
        <Bullet text="Usage Information: Interactions with features, search history, screens visited, and timestamps." />
        <Bullet text="Location Data: We collect location data only with your explicit consent, used to provide geo-specific services." />
      </Section>

      <Section title="3. How We Use Your Information">
        <Bullet text="To create and manage your account." />
        <Bullet text="To enable social or location-based app features." />
        <Bullet text="To personalize content, recommendations, and ads (if applicable)." />
        <Bullet text="To improve app performance, troubleshoot bugs, and conduct research and analytics." />
        <Bullet text="To send service updates, reminders, marketing messages, or promotional content (you may opt out)." />
      </Section>

      <Section title="4. Legal Bases for Processing">
        <Text style={styles.paragraph}>
          We rely on several legal grounds to process your data, including your consent, performance of a contract, compliance with legal obligations, and our legitimate interests (such as fraud prevention, security, and product development).
        </Text>
      </Section>

      <Section title="5. Sharing and Disclosure">
        <Bullet text="With Service Providers: We share data with hosting, analytics, and customer service providers." />
        <Bullet text="With Legal Authorities: When required by law, legal process, or to protect rights and safety." />
        <Bullet text="With Other Users: If you publish content (e.g. listings, reviews), it may be visible to others using the app." />
        <Bullet text="In Business Transfers: If the company is involved in a merger, acquisition, or asset sale." />
      </Section>

      <Section title="6. Data Retention">
        <Text style={styles.paragraph}>
          We retain your information as long as your account is active or as necessary for legal, regulatory, or operational purposes. You may request deletion of your account at any time.
        </Text>
      </Section>

      <Section title="7. Your Rights and Choices">
        <Bullet text="Access and Correction: You can access and update your account information in-app." />
        <Bullet text="Delete Account: You can request permanent deletion of your account and data." />
        <Bullet text="Marketing Preferences: Opt out of promotional communications through app settings or unsubscribe links." />
        <Bullet text="Location Settings: Manage location access via your mobile device settings." />
        <Bullet text="Data Portability: Upon request, we can provide a copy of your data in a commonly used format." />
      </Section>

      <Section title="8. Children’s Privacy">
        <Text style={styles.paragraph}>
          Our app is not intended for use by children under 13 (or under 16 in some jurisdictions). We do not knowingly collect personal data from children. If you believe we have done so, please contact us immediately.
        </Text>
      </Section>

      <Section title="9. Data Security">
        <Text style={styles.paragraph}>
          We implement appropriate security measures including encryption, secure storage, and limited data access to protect your information. However, no method of electronic transmission or storage is 100% secure.
        </Text>
      </Section>

      <Section title="10. International Users">
        <Text style={styles.paragraph}>
          If you are accessing the app from outside the country where our servers are located, your data may be transferred to and processed in that country, where data protection laws may differ.
        </Text>
      </Section>

      <Section title="11. Changes to This Policy">
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. If we make material changes, we will notify you via the app or by other means. Your continued use of the app constitutes your acceptance of the revised policy.
        </Text>
      </Section>

      <Section title="12. Contact Us">
        <Text style={styles.paragraph}>
          If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
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

export default PrivacyPolicy;
