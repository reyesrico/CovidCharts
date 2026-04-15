// Helper function to get date 7 days ago
export const getDateWeekAgo = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - 7);
  return newDate;
};

// Helper function to get date N days ago from a reference date (defaults to today)
export const getDaysAgoDate = (days: number, from: Date = new Date()): Date => {
  const date = new Date(from);
  date.setDate(date.getDate() - days);
  return date;
};

// Helper function to format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
