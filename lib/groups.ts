export type SmallGroup = {
  name: string;
  leader: string;
  members: string[];
};

export async function getSmallGroups(): Promise<SmallGroup[]> {
  return groups;
}

export const groups: SmallGroup[] = [
  {
    name: "Boy's Group 1",
    leader: "Michael Tso",
    members: ["Caleb Park", "Chris Kim", "Sam Timaran", "Timothy Ha", "David Sung", "Ryder Min"],
  },
  {
    name: "Boy's Group 2",
    leader: "Joshua Ra",
    members: ["Daniel Choi", "Josh Joung", "Nathan Im", "Isaac Kim", "Alvin Shin (F)", "Brendon Park"],
  },
  {
    name: "Boy's Group 3",
    leader: "Matty Yoon",
    members: ["John Choi", "Thomas Kang", "Brian Song", "Wesley Park", "Matt Na", "Steven Quan"],
  },
  {
    name: "Boy's Group 4",
    leader: "Elliot Bae",
    members: ["Josh Lee", "Alvin Shin (J)", "Jeremy Kim", "Andrew Son", "Eason Chiu"],
  },
  {
    name: "Boy's Group 5",
    leader: "Ronan Magla",
    members: ["Ethan Kim", "Neyferson Solis", "Daniel HR", "Josh Choi", "Elijah Kim"],
  },
  {
    name: "Girl's Group 1",
    leader: "Sharon Park",
    members: ["Sophia Kim", "Alexis Kim", "Gloria Cho", "Lora Lee", "Esther Song"],
  },
  {
    name: "Girl's Group 2",
    leader: "Leah Jun",
    members: ["Rae Kim", "Abellia Kim", "Saebin Jung", "Lia Hwang", "Chenny Kang"],
  },
  {
    name: "Girl's Group 3",
    leader: "Nana Kim",
    members: ["Lisa Kim", "Selena Xie", "Catherine Park", "Lina Kim"],
  },
];