import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { checkUserData } from '../../lib/check-user';

export default function CheckUser() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const data = await checkUserData('sdcharron@enter360.com');
      setUserData(data);
      setLoading(false);
    }
    fetchUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>User Data:</Text>
      <Text style={styles.data}>{JSON.stringify(userData, null, 2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1A2C3E',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
  },
  data: {
    color: '#AAAAAA',
    fontSize: 14,
    fontFamily: 'monospace',
  },
});