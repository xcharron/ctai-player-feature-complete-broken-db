import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, User, Phone, ChevronRight, CircleAlert as AlertCircle } from 'lucide-react-native';
import DynamicText from '../../components/DynamicText';

export default function RegisterScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isDevelopment] = useState(__DEV__);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+1');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [registrationStep, setRegistrationStep] = useState<'validating' | 'creating' | 'complete'>('validating');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rateLimitTimeout, setRateLimitTimeout] = useState<number | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(5); // Default limit per hour

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const disposableEmailRegex = /@(tempmail\.com|throwawaymail\.com|mailinator\.com|guerrillamail\.com|sharklasers\.com|grr\.la|guerrillamail\.net|spam4\.me|byom\.de|dispostable\.com|yopmail\.com|10minutemail\.com)$/i;
    
    return emailRegex.test(email) && !disposableEmailRegex.test(email);
  };

  const handleRegister = async () => {
    try {
      // Skip rate limit check in development
      if (!isDevelopment) {
        if (rateLimitTimeout && Date.now() < rateLimitTimeout) {
          const waitMinutes = Math.ceil((rateLimitTimeout - Date.now()) / 60000);
          setError(`Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before trying again.`);
          return;
        }
      }

      if (isSubmitted) {
        setError('Registration already submitted. Please check your email for verification or try signing in.');
        router.replace('/auth/login');
        return;
      }

      setLoading(true);
      console.log('Starting registration process...');
      setRegistrationStep('validating');
      setError(null);

      // Validate required inputs
      if (!firstName || !lastName || !email || !password || !phone) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Validate phone format
      if (!validatePhone(phone)) {
        setError('Please enter a valid phone number (e.g., +12345678900)');
        setLoading(false);
        return;
      }

      // Validate email format and check for disposable email services
      if (!validateEmail(email)) {
        setError('Please enter a valid email address. Disposable email services are not allowed.');
        setLoading(false);
        return;
      }

      setRegistrationStep('creating');
      console.log('Creating user account...');
      
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (authData.user) {
        console.log('User created successfully:', authData.user.id);
        setRegistrationStep('complete');
        setIsSubmitted(true);
        // Show confirmation message
        setError('Please check your email to verify your account before signing in.');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = 'An error occurred during registration';
      
      // Handle specific error cases
      if (err.message?.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (err.message?.includes('Password should be at least 6 characters')) {
        errorMessage = 'Password must be at least 6 characters long';
      } else if (err.message?.includes('hour.error.email.rate')) {
        if (!isDevelopment) {
          // Set a 30-minute timeout for rate limit in production
          const timeout = Date.now() + 30 * 60 * 1000;
          setRateLimitTimeout(timeout);
          const waitMinutes = Math.ceil((timeout - Date.now()) / 60000);
          errorMessage = `Rate limit reached. Please wait ${waitMinutes} minutes before trying again, or sign in with an existing account.`;
          // Clear form to prevent repeated submissions
          setEmail('');
          setPassword('');
        } else {
          // In development, show a more helpful message
          setRateLimitRemaining(prev => Math.max(0, prev - 1));
          errorMessage = `Rate limit hit (${rateLimitRemaining} attempts remaining). In development mode, you can:\n\n` +
            '• Use different email addresses\n' +
            '• Wait a few minutes between attempts\n' +
            '• Sign in with an existing account';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('Registration error details:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo} 
            resizeMode="contain"
          />
          <DynamicText style={styles.brandTitle}>CallTuneAI</DynamicText>
          <DynamicText style={styles.title}>Create Account</DynamicText>
          <DynamicText style={styles.subtitle}>Join us to start your 30-day trial</DynamicText>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <User size={20} color="#AAAAAA" />
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#AAAAAA"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <User size={20} color="#AAAAAA" />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#AAAAAA"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#AAAAAA" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#AAAAAA"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#AAAAAA" />
              <TextInput
                placeholder="Phone Number"
                style={styles.input}
                placeholderTextColor="#AAAAAA"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>
            <Text style={styles.inputHelper}>
              Format: +12345678900 (no spaces or dashes)
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#AAAAAA" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#AAAAAA"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading || isSubmitted}
          >
            <Text style={styles.buttonText}>
              {loading ? (
                registrationStep === 'validating' ? 'Validating...' :
                registrationStep === 'creating' ? 'Creating Account...' :
                'Account Created!'
              ) : isSubmitted ? (
                'Check Email to Verify'
              ) : 'Create Account'}
            </Text>
            {!loading && !isSubmitted && <ChevronRight size={20} color="#FFFFFF" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.linkText}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2C3E',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 32,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 10,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 12,
  },
  brandTitle: {
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    fontSize: 32,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    color: '#FF3B30',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0496FF',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#0496FF',
    fontSize: 16,
    fontFamily: 'Inter-Medium'
  },
  inputHelper: {
    color: '#AAAAAA',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    paddingHorizontal: 16
  },
});