import { Card } from "../store/types";
import { v4 } from "uuid";
import { DateTime } from "luxon";

export const generateCard = (seriesNum: number): Card => ({
  id: v4(),
  name: 'test' + seriesNum.toString(),
  created: DateTime.local(),
  modified: DateTime.local(),
  repo: null,
  ref: null,
  left: 10 * seriesNum,
  top: 25 + (5 * seriesNum)
});

export const generateCards = (count: number) => {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    cards.push(generateCard(i));
  }
  return cards;
}