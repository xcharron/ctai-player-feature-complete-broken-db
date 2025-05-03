import React, { useState, useEffect } from 'react';
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
  Linking,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, User, Phone, ChevronRight, CircleAlert as AlertCircle, CircleCheck as CheckCircle2 } from 'lucide-react-native';
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
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'validating' | 'creating' | 'complete'>('validating');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rateLimitTimeout, setRateLimitTimeout] = useState<number | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(5);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const disposableEmailRegex = /@(tempmail\.com|throwawaymail\.com|mailinator\.com|guerrillamail\.com|sharklasers\.com|grr\.la|guerrillamail\.net|spam4\.me|byom\.de|dispostable\.com|yopmail\.com|10minutemail\.com)$/i;
    return emailRegex.test(email) && !disposableEmailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleOpenEmail = () => {
    dismissKeyboard();
    if (Platform.OS === 'web') {
      window.open('https://outlook.office.com', '_blank');
    } else {
      Linking.openURL('message://');
    }
  };

  const handleSignInPress = () => {
    dismissKeyboard();
    router.push('/auth/login');
  };

  const handleRegister = async () => {
    if (!mounted) return;
    
    try {
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
      setRegistrationStep('validating');
      setError(null);

      if (!firstName || !lastName || !email || !password || !phone) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      if (!validatePhone(phone)) {
        setError('Please enter a valid phone number (+1XXXXXXXXXX)');
        setLoading(false);
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address. Disposable email services are not allowed.');
        setLoading(false);
        return;
      }

      if (!validatePassword(password)) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      setRegistrationStep('creating');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone
          },
          emailRedirectTo: Platform.select({
            web: 'https://calltuneai.com/auth/verify',
            ios: 'calltuneai://auth/verify',
            android: 'calltuneai://auth/verify',
            default: 'https://calltuneai.com/auth/verify'
          })
        }
      });

      if (authError) {
        if (authError.message.includes('sending confirmation email')) {
          setError('Unable to send verification email. Please try again later or contact support.');
        } else if (authError.message.includes('User already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else if (authError.message.includes('Password should be')) {
          setError('Password must be at least 6 characters long');
        } else {
          throw authError;
        }
        return;
      }

      if (authData.user) {
        setRegistrationStep('complete');
        setIsSubmitted(true);
        setShowSuccessMessage(true);
        setError(null);
        
        setTimeout(() => {
          if (mounted) {
            router.replace('/auth/login');
          }
        }, 3000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = 'An error occurred during registration';
      
      if (err.message?.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (err.message?.includes('Password should be at least 6 characters')) {
        errorMessage = 'Password must be at least 6 characters long';
      } else if (err.message?.includes('hour.error.email.rate')) {
        if (!isDevelopment) {
          const timeout = Date.now() + 30 * 60 * 1000;
          setRateLimitTimeout(timeout);
          const waitMinutes = Math.ceil((timeout - Date.now()) / 60000);
          errorMessage = `Rate limit reached. Please wait ${waitMinutes} minutes before trying again, or sign in with an existing account.`;
          setEmail('');
          setPassword('');
        } else {
          setRateLimitRemaining(prev => Math.max(0, prev - 1));
          errorMessage = `Rate limit hit (${rateLimitRemaining} attempts remaining). In development mode, you can:\n\n` +
            '• Use different email addresses\n' +
            '• Wait a few minutes between attempts\n' +
            '• Sign in with an existing account';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -64 : 0}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo} 
              resizeMode="contain"
            />
            <DynamicText style={styles.brandTitle}>CallTuneAI</DynamicText>
            <DynamicText style={styles.brandSubtitle}>Player</DynamicText>
            <DynamicText style={styles.title}>Create Account</DynamicText>
            <DynamicText style={styles.subtitle}>Join us to start your 30-day trial</DynamicText>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {showSuccessMessage && (
            <View style={styles.successContainer}>
              <CheckCircle2 size={24} color="#4CD964" />
              <View style={styles.successTextContainer}>
                <Text style={styles.successTitle}>Account Created Successfully!</Text>
                <Text style={styles.successText}>
                  Please check your email to verify your account.
                </Text>
                <TouchableOpacity
                  style={styles.checkEmailButton}
                  onPress={handleOpenEmail}
                >
                  <Mail size={20} color="#FFFFFF" />
                  <Text style={styles.checkEmailText}>Open Email App</Text>
                </TouchableOpacity>
              </View>
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
                    editable={!showSuccessMessage}
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
                    editable={!showSuccessMessage}
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
                  editable={!showSuccessMessage}
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
                  editable={!showSuccessMessage}
                />
              </View>
              <Text style={styles.inputHelper}>Format: +1XXXXXXXXXX</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#AAAAAA" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#AAAAAA"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setShowPasswordHints(true);
                  }}
                  secureTextEntry
                  onFocus={() => setShowPasswordHints(true)}
                  onBlur={() => setShowPasswordHints(false)}
                  editable={!showSuccessMessage}
                />
              </View>
              {showPasswordHints && (
                <View style={styles.passwordHints}>
                  <Text style={[
                    styles.passwordHint,
                    password.length >= 6 ? styles.passwordHintValid : styles.passwordHintInvalid
                  ]}>
                    • At least 6 characters
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (loading || showSuccessMessage) && styles.buttonDisabled
              ]}
              onPress={handleRegister}
              disabled={loading || isSubmitted || showSuccessMessage}
            >
              <Text style={styles.buttonText}>
                {loading ? (
                  registrationStep === 'validating' ? 'Validating...' :
                  registrationStep === 'creating' ? 'Creating Account...' :
                  'Account Created!'
                ) : showSuccessMessage ? (
                  'Check Email to Verify'
                ) : 'Create Account'}
              </Text>
              {!loading && !showSuccessMessage && <ChevronRight size={20} color="#FFFFFF" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleSignInPress}
            >
              <Text style={styles.linkText}>
                Already have an account? Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2C3E',
  },
  scrollContent: {
    minHeight: '100%',
    paddingHorizontal: 24,
    paddingTop: Platform.select({ ios: 10, android: 10, default: 10 }),
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 0,
  },
  brandTitle: {
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    fontSize: 28,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontFamily: 'Orbitron-Bold',
    color: '#0496FF',
    fontSize: 16,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  successTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  successTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#4CD964',
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  checkEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CD964',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  checkEmailText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
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
    paddingHorizontal: 4
  },
  passwordHints: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  passwordHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  passwordHintValid: {
    color: '#4CD964',
  },
  passwordHintInvalid: {
    color: '#FF3B30',
  },
});