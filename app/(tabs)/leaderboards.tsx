import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star,
  TrendingUp,
  Users
} from 'lucide-react-native';
// import FriendsFeed from '../../components/FriendsFeed';
// import BoosterShop from '../../components/BoosterShop';
import LeagueBadge from '../../components/LeagueBadge';
import GemsDisplay from '../../components/GemsDisplay';

interface LeaderboardUser {
  id: number;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  level: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<'league' | 'friends' | 'shop'>('league');
  
  const leagueLeaders: LeaderboardUser[] = [
    { id: 1, name: "Sarah M.", avatar: "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2", xp: 850, streak: 14, level: 5, rank: 1 },
    { id: 2, name: "David K.", avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2", xp: 720, streak: 12, level: 4, rank: 2 },
    { id: 3, name: "You", avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2", xp: 650, streak: 7, level: 3, rank: 3 },
    { id: 4, name: "Rachel L.", avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2", xp: 580, streak: 9, level: 4, rank: 4 },
    { id: 5, name: "Michael P.", avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2", xp: 420, streak: 8, level: 3, rank: 5 },
  ];

  const userRank = leagueLeaders.find(user => user.name === "You")?.rank || 0;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown size={24} color="#D4AF37" />;
      case 2: return <Medal size={24} color="#C0C0C0" />;
      case 3: return <Medal size={24} color="#CD7F32" />;
      default: return <Text style={styles.rankNumber}>{rank}</Text>;
    }
  };

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1: return ['#D4AF37', '#B8860B'];
      case 2: return ['#C0C0C0', '#A8A8A8'];
      case 3: return ['#CD7F32', '#A0522D'];
      default: return ['#FFFFFF', '#F8FAFC'];
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Friends Feed</Text>
            <Text style={styles.placeholderSubtext}>Available in production build</Text>
          </View>
        );
      case 'shop':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Booster Shop</Text>
            <Text style={styles.placeholderSubtext}>Available in production build</Text>
          </View>
        );
      default:
        return renderLeague();
    }
  };

  const renderLeague = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

      {/* League Status */}
      <View style={styles.section}>
        <View style={styles.leagueCard}>
          <View style={styles.leagueHeader}>
            <LeagueBadge league="Silver" size="large" />
            <View style={styles.leagueInfo}>
              <Text style={styles.leagueTitle}>Silver League</Text>
              <Text style={styles.leagueRank}>#{userRank} this week</Text>
            </View>
            <GemsDisplay gems={125} />
          </View>
          <Text style={styles.leagueDescription}>
            Top 5 get promoted • Bottom 5 get relegated
          </Text>
        </View>
      </View>

      {/* Weekly Leaderboard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week's Rankings</Text>
        {leagueLeaders.map((user, index) => (
          <TouchableOpacity
            key={user.id}
            style={[
              styles.leaderCard,
              user.name === "You" && styles.currentUserCard
            ]}
          >
            <LinearGradient
              colors={user.rank <= 3 ? getRankGradient(user.rank) : ['#FFFFFF', '#FFFFFF']}
              style={styles.leaderGradient}
            >
              <View style={styles.leaderContent}>
                <View style={styles.rankContainer}>
                  {getRankIcon(user.rank)}
                </View>
                
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatar}
                />
                
                <View style={styles.userInfo}>
                  <Text style={[
                    styles.userName,
                    user.rank <= 3 && styles.topRankText,
                    user.name === "You" && styles.currentUserText
                  ]}>
                    {user.name}
                  </Text>
                  <View style={styles.userStats}>
                    <Star size={14} color="#D4AF37" />
                    <Text style={[
                      styles.userXP,
                      user.rank <= 3 && styles.topRankText
                    ]}>
                      {user.xp} weekly XP
                    </Text>
                    <Text style={[
                      styles.userLevel,
                      user.rank <= 3 && styles.topRankText
                    ]}>
                      Level {user.level}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.streakContainer}>
                  <Text style={[
                    styles.streakText,
                    user.rank <= 3 && styles.topRankText
                  ]}>
                    🔥 {user.streak}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Encouragement */}
      <View style={styles.encouragementContainer}>
        <Text style={styles.encouragementTitle}>
          "Iron sharpens iron, so one person sharpens another."
        </Text>
        <Text style={styles.encouragementVerse}>— Proverbs 27:17</Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Connect, compete, and grow together</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'league' && styles.activeTab]}
          onPress={() => setActiveTab('league')}
        >
          <Trophy size={16} color={activeTab === 'league' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'league' && styles.activeTabText]}>
            League
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Users size={16} color={activeTab === 'friends' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shop' && styles.activeTab]}
          onPress={() => setActiveTab('shop')}
        >
          <Text style={[styles.tabEmoji, activeTab === 'shop' && styles.activeTabText]}>💎</Text>
          <Text style={[styles.tabText, activeTab === 'shop' && styles.activeTabText]}>
            Shop
          </Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabEmoji: {
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  leagueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueInfo: {
    flex: 1,
    marginLeft: 16,
  },
  leagueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  leagueRank: {
    fontSize: 14,
    color: '#6B7280',
  },
  leagueDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  leaderCard: {
    borderRadius: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  leaderGradient: {
    padding: 16,
  },
  leaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  topRankText: {
    color: '#FFFFFF',
  },
  currentUserText: {
    color: '#3B82F6',
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userXP: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  userLevel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  encouragementContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  encouragementTitle: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  encouragementVerse: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E3A8A',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});