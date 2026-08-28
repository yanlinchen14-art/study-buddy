'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Badge, UserLevel, StudyStreak } from '@/lib/types';

interface LevelUpResult {
  leveledUp: boolean;
  newLevel: number;
  totalExp: number;
}

interface BadgeUnlockResult {
  unlocked: Badge[];
}

// 经验值计算规则
const EXP_RULES = {
  taskComplete: 50,
  sessionEnd: 10, // 每分钟
  outcomeUpload: 30,
  checkin: 20,
  dailyBonus: 15,
  streakMilestone: (days: number) => {
    if (days % 10 === 0) return 100; // 每 10 天
    if (days % 7 === 0) return 50; // 每周
    if (days % 3 === 0) return 25; // 每 3 天
    return 0;
  },
};

// 等级升级所需经验值
const LEVEL_REQUIREMENTS = {
  1: 0,
  2: 200,
  3: 500,
  4: 1000,
  5: 1800,
  6: 2800,
  7: 4000,
  8: 5400,
  9: 7000,
  10: 8800,
};

// 徽章解锁条件
const BADGE_CONDITIONS = {
  first_checkin: {
    type: 'checkin',
    count: 1,
  },
  week_warrior: {
    type: 'consecutive_days',
    target: 7,
  },
  month_master: {
    type: 'consecutive_days',
    target: 30,
  },
  task_hero: {
    type: 'tasks_completed',
    target: 10,
  },
  study_enthusiast: {
    type: 'total_minutes',
    target: 600, // 10 hours
  },
  early_bird: {
    type: 'early_session',
    target: 5, // 5 sessions before 8am
  },
  night_owl: {
    type: 'late_session',
    target: 5, // 5 sessions after 10pm
  },
  sharing_champion: {
    type: 'outcomes_shared',
    target: 5,
  },
  level_5: {
    type: 'level_reached',
    target: 5,
  },
  exp_collector: {
    type: 'total_exp',
    target: 5000,
  },
};

export function useGameification() {
  // 记录经验值
  const addExperience = useCallback(
    async (
      spaceId: string,
      userId: string,
      expType: string,
      expAmount: number,
      relatedId?: string,
    ) => {
      try {
        const { error } = await supabase.from('experience_logs').insert({
          space_id: spaceId,
          user_id: userId,
          exp_type: expType,
          exp_amount: expAmount,
          related_id: relatedId,
        });

        if (error) throw error;

        // 更新用户等级
        const levelResult = await updateUserLevel(spaceId, userId, expAmount);
        return levelResult;
      } catch (err) {
        console.error('Failed to add experience:', err);
        throw err;
      }
    },
    [],
  );

  // 更新用户等级
  const updateUserLevel = useCallback(
    async (spaceId: string, userId: string, expGain: number) => {
      try {
        // 获取当前等级信息
        const { data: levelData, error: fetchError } = await supabase
          .from('user_levels')
          .select('*')
          .eq('space_id', spaceId)
          .eq('user_id', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const currentLevel = levelData?.current_level || 1;
        const totalExp = (levelData?.total_experience || 0) + expGain;
        const previousExp = currentLevel === 1 ? 0 : (LEVEL_REQUIREMENTS[currentLevel as keyof typeof LEVEL_REQUIREMENTS] || 0);
        let currentExp = (levelData?.current_experience || 0) + expGain;

        let newLevel = currentLevel;
        let leveledUp = false;

        // 检查等级提升
        for (let level = currentLevel + 1; level <= 10; level++) {
          const required = LEVEL_REQUIREMENTS[level as keyof typeof LEVEL_REQUIREMENTS];
          if (totalExp >= required) {
            newLevel = level;
            leveledUp = true;
          } else {
            break;
          }
        }

        // 计算当前等级的经验进度
        const nextLevelReq = LEVEL_REQUIREMENTS[newLevel + 1 as keyof typeof LEVEL_REQUIREMENTS] || 9999;
        const currentLevelReq = LEVEL_REQUIREMENTS[newLevel as keyof typeof LEVEL_REQUIREMENTS] || 0;
        currentExp = totalExp - currentLevelReq;

        // 更新数据库
        const { error: updateError } = await supabase
          .from('user_levels')
          .upsert({
            space_id: spaceId,
            user_id: userId,
            current_level: newLevel,
            total_experience: totalExp,
            current_experience: currentExp,
            level_up_at: leveledUp ? new Date().toISOString() : levelData?.level_up_at,
          });

        if (updateError) throw updateError;

        // 如果升级了，检查徽章解锁
        if (leveledUp) {
          await checkBadgeUnlock(spaceId, userId, {
            type: 'level_reached',
            level: newLevel,
          });
        }

        return {
          leveledUp,
          newLevel,
          totalExp,
          currentExp,
          nextLevelReq,
          progressPercent: Math.round(
            ((currentExp) / (nextLevelReq - currentLevelReq)) * 100,
          ),
        };
      } catch (err) {
        console.error('Failed to update user level:', err);
        throw err;
      }
    },
    [],
  );

  // 打卡签到
  const dailyCheckin = useCallback(
    async (spaceId: string, userId: string): Promise<{ checkedIn: boolean; streak: number }> => {
      const today = new Date().toISOString().split('T')[0];

      try {
        // 检查今天是否已打卡
        const { data: existing } = await supabase
          .from('daily_checkins')
          .select('*')
          .eq('space_id', spaceId)
          .eq('user_id', userId)
          .eq('checkin_date', today)
          .single();

        if (existing) {
          return { checkedIn: false, streak: existing.consecutive_days };
        }

        // 获取最后一次打卡
        const { data: lastCheckin } = await supabase
          .from('daily_checkins')
          .select('checkin_date, consecutive_days')
          .eq('space_id', spaceId)
          .eq('user_id', userId)
          .order('checkin_date', { ascending: false })
          .limit(1)
          .single();

        let consecutiveDays = 1;
        if (lastCheckin) {
          const lastDate = new Date(lastCheckin.checkin_date);
          const todayDate = new Date(today);
          const diffTime = todayDate.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            consecutiveDays = lastCheckin.consecutive_days + 1;
          } else if (diffDays > 1) {
            consecutiveDays = 1;
          }
        }

        // 记录打卡
        const { error } = await supabase.from('daily_checkins').insert({
          space_id: spaceId,
          user_id: userId,
          checkin_date: today,
          consecutive_days: consecutiveDays,
        });

        if (error) throw error;

        // 记录经验值
        await addExperience(spaceId, userId, 'checkin', EXP_RULES.checkin);

        // 检查连续打卡里程碑
        const streakBonus = EXP_RULES.streakMilestone(consecutiveDays);
        if (streakBonus > 0) {
          await addExperience(
            spaceId,
            userId,
            'consecutive_streak',
            streakBonus,
          );
        }

        // 更新学习条纹记录
        await updateStudyStreak(spaceId, userId, consecutiveDays);

        // 检查徽章解锁
        await checkBadgeUnlock(spaceId, userId, {
          type: 'checkin',
          count: 1,
        });

        if (consecutiveDays === 7) {
          await checkBadgeUnlock(spaceId, userId, {
            type: 'consecutive_days',
            days: 7,
          });
        }

        if (consecutiveDays === 30) {
          await checkBadgeUnlock(spaceId, userId, {
            type: 'consecutive_days',
            days: 30,
          });
        }

        return { checkedIn: true, streak: consecutiveDays };
      } catch (err) {
        console.error('Failed to check in:', err);
        throw err;
      }
    },
    [addExperience],
  );

  // 更新学习条纹
  const updateStudyStreak = useCallback(
    async (spaceId: string, userId: string, currentStreak: number) => {
      try {
        const { data: streak } = await supabase
          .from('study_streaks')
          .select('*')
          .eq('space_id', spaceId)
          .eq('user_id', userId)
          .single();

        const newTotalStreaks = (streak?.total_streaks || 0) + (currentStreak === 1 ? 1 : 0);
        const newLongestStreak = Math.max(
          streak?.longest_streak || 0,
          currentStreak,
        );

        const { error } = await supabase.from('study_streaks').upsert({
          space_id: spaceId,
          user_id: userId,
          current_streak: currentStreak,
          total_streaks: newTotalStreaks,
          longest_streak: newLongestStreak,
          last_checkin_date: new Date().toISOString().split('T')[0],
          streak_started_at: streak?.streak_started_at || new Date().toISOString().split('T')[0],
        });

        if (error) throw error;
      } catch (err) {
        console.error('Failed to update study streak:', err);
        throw err;
      }
    },
    [],
  );

  // 记录积分
  const addPoints = useCallback(
    async (
      spaceId: string,
      userId: string,
      pointsType: string,
      pointsAmount: number,
      reason?: string,
    ) => {
      try {
        const { error } = await supabase.from('points_logs').insert({
          space_id: spaceId,
          user_id: userId,
          points_type: pointsType,
          points_amount: pointsAmount,
          reason,
          recoverable: pointsAmount < 0,
        });

        if (error) throw error;
      } catch (err) {
        console.error('Failed to add points:', err);
        throw err;
      }
    },
    [],
  );

  // 检查徽章解锁
  const checkBadgeUnlock = useCallback(
    async (spaceId: string, userId: string, condition: any) => {
      try {
        const badgesToUnlock: Badge[] = [];

        // 简化检查逻辑
        if (condition.type === 'checkin' && condition.count === 1) {
          // 第一次打卡
          const badges = await supabase
            .from('badges')
            .select('*')
            .eq('code', 'first_checkin');

          if (badges.data && badges.data.length > 0) {
            badgesToUnlock.push(badges.data[0]);
          }
        }

        if (condition.type === 'consecutive_days') {
          const code = condition.days === 7 ? 'week_warrior' : 'month_master';
          const badges = await supabase
            .from('badges')
            .select('*')
            .eq('code', code);

          if (badges.data && badges.data.length > 0) {
            badgesToUnlock.push(badges.data[0]);
          }
        }

        if (condition.type === 'level_reached') {
          if (condition.level === 5) {
            const badges = await supabase
              .from('badges')
              .select('*')
              .eq('code', 'level_5');

            if (badges.data && badges.data.length > 0) {
              badgesToUnlock.push(badges.data[0]);
            }
          }
        }

        // 保存已解锁的徽章
        for (const badge of badgesToUnlock) {
          const { error: checkError } = await supabase
            .from('user_badges')
            .select('*')
            .eq('space_id', spaceId)
            .eq('user_id', userId)
            .eq('badge_id', badge.id)
            .single();

          // 只有当用户还未拥有此徽章时才插入
          if (checkError?.code === 'PGRST116') {
            await supabase.from('user_badges').insert({
              space_id: spaceId,
              user_id: userId,
              badge_id: badge.id,
            });
          }
        }

        return { unlocked: badgesToUnlock };
      } catch (err) {
        console.error('Failed to check badge unlock:', err);
        return { unlocked: [] };
      }
    },
    [],
  );

  // 获取用户等级信息
  const getUserLevel = useCallback(
    async (spaceId: string, userId: string): Promise<UserLevel | null> => {
      try {
        const { data } = await supabase
          .from('user_levels')
          .select('*')
          .eq('space_id', spaceId)
          .eq('user_id', userId)
          .single();

        return data || null;
      } catch (err) {
        console.error('Failed to get user level:', err);
        return null;
      }
    },
    [],
  );

  // 获取用户徽章
  const getUserBadges = useCallback(
    async (spaceId: string, userId: string): Promise<Badge[]> => {
      try {
        const { data } = await supabase
          .from('user_badges')
          .select(
            `
            badge_id,
            badges (*)
          `,
          )
          .eq('space_id', spaceId)
          .eq('user_id', userId);

        return data?.map((item: any) => item.badges).filter(Boolean) || [];
      } catch (err) {
        console.error('Failed to get user badges:', err);
        return [];
      }
    },
    [],
  );

  return {
    addExperience,
    updateUserLevel,
    dailyCheckin,
    addPoints,
    checkBadgeUnlock,
    getUserLevel,
    getUserBadges,
  };
}
