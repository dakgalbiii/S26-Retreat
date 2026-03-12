export type ScheduleItem = {
  time: string;
  title: string;
  subtitle?: string;
  highlight?: boolean; // gold star sessions
};

export type ScheduleDay = {
  day: string;
  date: string;
  items: ScheduleItem[];
};

export const schedule: ScheduleDay[] = [
  {
    day: "Friday",
    date: "Mar 13",
    items: [
      { time: "3:00-5:00pm", title: "Arrive at Retreat Center" },
      { time: "5:00-6:00pm", title: "Room Assignments" },
      { time: "6:00-7:00pm", title: "Dinner" },
      { time: "7:00-7:30pm", title: "Icebreakers / Orientation" },
      { time: "7:30-8:00pm", title: "Slight Downtime / Serving Team Prayer" },
      { time: "8:00-10:00pm", title: "Session No. 1", highlight: true },
      { time: "10:00-11:00pm", title: "Small Groups" },
      { time: "11:00pm-12:00am", title: "Wash Up" },
      { time: "12:00am", title: "Lights Out" },
    ],
  },
  {
    day: "Saturday",
    date: "Mar 14",
    items: [
      { time: "6:30-7:30am", title: "Morning Prayer", subtitle: "in sanctuary (MANDATORY)" },
      { time: "7:30-8:00am", title: "Wash Up" },
      { time: "8:00-9:00am", title: "Breakfast" },
      { time: "9:00-9:45am", title: "Activity" },
      { time: "9:45-10:00am", title: "Slight Downtime / Serving Team Prayer" },
      { time: "10:00am-12:00pm", title: "Session No. 2", highlight: true },
      { time: "12:00-1:00pm", title: "Lunch" },
      { time: "1:00-2:00pm", title: "Quality Time" },
      { time: "2:00-4:30pm", title: "Games" },
      { time: "4:30-6:00pm", title: "Free Time" },
      { time: "6:00-7:00pm", title: "Dinner" },
      { time: "7:00-9:30pm", title: "Session No. 3", highlight: true },
      { time: "9:30-10:30pm", title: "Small Groups" },
      { time: "10:30-11:30pm", title: "Free Time / Wash Up" },
      { time: "12:00am", title: "Lights Out" },
    ],
  },
  {
    day: "Sunday",
    date: "Mar 15",
    items: [
      { time: "8:00-9:00am", title: "Morning Prayer", subtitle: "in sanctuary (Optional)" },
      { time: "9:00-9:30am", title: "Wash Up & Pack" },
      { time: "9:30-10:30am", title: "Breakfast" },
      { time: "10:30am-1:00pm", title: "Session No. 4", highlight: true },
      { time: "1:00-1:30pm", title: "Pack / Load Up" },
      { time: "1:30-2:00pm", title: "Pictures" },
      { time: "2:00pm", title: "Leave Retreat Center" },
    ],
  },
];

export const rules = [
  {
    title: "No leaving premises",
    body: "Stay on the grounds of the retreat center unless given permission from Michael.",
  },
  {
    title: "No purpling",
    body: "Please refrain from going to opposite gender rooms. Let's leave some room for Jesus!",
  },
  {
    title: "Cleanliness",
    body: "Always leave the space cleaner than you found it.",
  },
  {
    title: "Limit phones",
    body: "Phones will be allowed to check schedules and groups; nonetheless, please stay present during small groups, games, and sessions by limiting phone usage.",
  },
  {
    title: "Confidentiality",
    body: "What is shared and discussed in small groups should stay in small groups.",
  },
];