import { supabase } from '../lib/supabase';

export async function saveFeedPreference(userId: string, feedUri: string, isPinned: boolean) {
  try {
    const { data, error } = await supabase
      .from('feed_preferences')
      .upsert({
        user_id: userId,
        feed_uri: feedUri,
        is_pinned: isPinned,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,feed_uri'
      });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error saving feed preference:', err);
    throw err;
  }
}

export async function getFeedPreferences(userId: string) {
  try {
    const { data, error } = await supabase
      .from('feed_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('order', { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error getting feed preferences:', err);
    throw err;
  }
}

export async function updateFeedOrder(userId: string, feedUris: string[]) {
  try {
    const updates = feedUris.map((uri, index) => ({
      user_id: userId,
      feed_uri: uri,
      order: index,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('feed_preferences')
      .upsert(updates, {
        onConflict: 'user_id,feed_uri'
      });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error updating feed order:', err);
    throw err;
  }
}