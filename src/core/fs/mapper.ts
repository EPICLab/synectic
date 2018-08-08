import { Card } from "../lib/Card";
import { cardTypes } from "../../app/cardTypes";

export function mapToJson(map: Map<any, any>): string {
  return JSON.stringify([...map]);
}

export function jsonToMap(jsonStr: string): Map<any, any> {
  return new Map(JSON.parse(jsonStr));
}

export function stringToCard<T extends Card>(cardClass: string): T {
  return new cardTypes[cardClass](global.Synectic.current);
}
