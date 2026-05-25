import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { auth } from '../src/config/firebase';
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '../src/services/friends';

export default function FriendsScreen() {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [friendsList, pending, sent] = await Promise.all([
        getFriends(),
        getPendingRequests(),
        getSentRequests(),
      ]);
      setFriends(friendsList);
      setPendingRequests(pending);
      setSentRequests(sent);
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSendRequest = async () => {
    if (!friendEmail) {
      Alert.alert('Error', 'Please enter an email');
      return;
    }
    
    try {
      await sendFriendRequest(friendEmail);
      Alert.alert('Success', 'Friend request sent!');
      setFriendEmail('');
      setModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAcceptRequest = async (requestId, fromUserId) => {
    try {
      await acceptFriendRequest(requestId, fromUserId);
      await loadData();
      Alert.alert('Success', 'Friend added!');
    } catch (error) {
      Alert.alert('Error', 'Could not accept request');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await declineFriendRequest(requestId);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Could not decline request');
    }
  };

  const handleRemoveFriend = async (friendId, friendName) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendId);
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Could not remove friend');
            }
          }
        }
      ]
    );
  };

  const renderFriend = ({ item }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onLongPress={() => handleRemoveFriend(item.id, item.displayName)}
      delayLongPress={500}
    >
      <Text style={styles.friendName}>{item.displayName}</Text>
      <Text style={styles.friendEmail}>{item.email}</Text>
    </TouchableOpacity>
  );

  const renderPendingRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{item.fromUserName || item.fromUserEmail}</Text>
        <Text style={styles.requestText}>Wants to be friends</Text>
      </View>
      <View style={styles.requestButtons}>
        <TouchableOpacity
          style={[styles.requestBtn, styles.acceptBtn]}
          onPress={() => handleAcceptRequest(item.id, item.fromUserId)}
        >
          <Text style={styles.btnText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestBtn, styles.declineBtn]}
          onPress={() => handleDeclineRequest(item.id)}
        >
          <Text style={styles.btnText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSentRequest = ({ item }) => (
    <View style={styles.sentCard}>
      <Text style={styles.sentName}>{item.toUserEmail}</Text>
      <Text style={styles.sentStatus}>Request sent - waiting for response</Text>
    </View>
  );

  const sections = [];
  
  if (pendingRequests.length > 0) {
    sections.push({ title: 'Friend Requests', data: pendingRequests, render: renderPendingRequest });
  }
  
  if (sentRequests.length > 0) {
    sections.push({ title: 'Sent Requests', data: sentRequests, render: renderSentRequest });
  }
  
  if (friends.length > 0) {
    sections.push({ title: `Friends (${friends.length})`, data: friends, render: renderFriend });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Add Friend</Text>
        </TouchableOpacity>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No friends yet</Text>
          <Text style={styles.emptySubtext}>Tap + Add Friend to get started</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item, index) => item.title + index}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              <FlatList
                data={item.data}
                keyExtractor={(subItem) => subItem.id}
                renderItem={item.render}
                scrollEnabled={false}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Friend</Text>
            <Text style={styles.modalSubtitle}>Enter their email address</Text>
            <TextInput
              style={styles.input}
              placeholder="friend@example.com"
              value={friendEmail}
              onChangeText={setFriendEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.sendBtn]} onPress={handleSendRequest}>
                <Text style={styles.sendBtnText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#6B3F1D' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  addButton: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: '#6B3F1D', fontWeight: 'bold' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 20, marginBottom: 10 },
  friendCard: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginHorizontal: 20, marginBottom: 8 },
  friendName: { fontSize: 16, fontWeight: '600', color: '#333' },
  friendEmail: { fontSize: 12, color: '#666', marginTop: 2 },
  requestCard: { backgroundColor: '#FFF3E0', padding: 15, borderRadius: 10, marginHorizontal: 20, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 14, fontWeight: '600', color: '#333' },
  requestText: { fontSize: 12, color: '#666', marginTop: 2 },
  requestButtons: { flexDirection: 'row', gap: 8 },
  requestBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
  acceptBtn: { backgroundColor: '#4CAF50' },
  declineBtn: { backgroundColor: '#f44336' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  sentCard: { backgroundColor: '#E8E8E8', padding: 15, borderRadius: 10, marginHorizontal: 20, marginBottom: 8 },
  sentName: { fontSize: 14, fontWeight: '600', color: '#666' },
  sentStatus: { fontSize: 12, color: '#999', marginTop: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#999', textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#ccc', marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 15, textAlign: 'center' },
  input: { backgroundColor: '#f2f2f2', borderRadius: 10, padding: 12, fontSize: 16 },
  modalButtons: { flexDirection: 'row', marginTop: 20, gap: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f2f2f2' },
  sendBtn: { backgroundColor: '#6B3F1D' },
  cancelBtnText: { color: '#333' },
  sendBtnText: { color: '#fff', fontWeight: 'bold' },
});