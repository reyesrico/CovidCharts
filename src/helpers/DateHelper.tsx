// Helper function to get date 7 days ago
export const getDateWeekAgo = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - 7);
  return newDate;
};

// Helper function to format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
