import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CircleCheck as CheckCircle } from 'lucide-react-native';
import DynamicText from '../../components/DynamicText';

export default function VerifyScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={48} color="#0496FF" />
        </View>
        <DynamicText style={styles.title}>Email Verified!</DynamicText>
        <DynamicText style={styles.description}>
          Your email has been verified successfully. You can now sign in to your account.
        </DynamicText>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <DynamicText style={styles.buttonText}>Continue to Sign In</DynamicText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2C3E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(4, 150, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Orbitron-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#0496FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});