"use client";
import { eachDayOfInterval } from "date-fns";
import { useState, useEffect } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

function SelectCalendar({
  reservation,
  onDatesChange,
}: {
  reservation:
    | {
        startDate: Date;
        endDate: Date;
      }[]
    | undefined;
  onDatesChange?: (dates: { startDate: Date; endDate: Date }) => void;
}) {
  const [dates, setDates] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  useEffect(() => {
    if (onDatesChange) {
      onDatesChange({
        startDate: dates[0].startDate,
        endDate: dates[0].endDate,
      });
    }
  }, [dates, onDatesChange]);

  let disabledDate: Date[] = [];
  reservation?.forEach((element) => {
    const dataRanch = eachDayOfInterval({
      start: new Date(element.startDate),
      end: new Date(element.endDate),
    });

    disabledDate = [...disabledDate, ...dataRanch];
  });

  return (
    <>
      <input
        type="hidden"
        name="startDate"
        value={dates[0].startDate.toISOString()}
      />
      <input
        type="hidden"
        name="endDate"
        value={dates[0].endDate.toISOString()}
      />
      <DateRange
        showDateDisplay={false}
        rangeColors={["#FF5A5F"]}
        ranges={dates}
        onChange={(item) => setDates([item.selection] as any)}
        minDate={new Date()}
        direction="vertical"
        disabledDates={disabledDate}
      />
    </>
  );
}

export default SelectCalendar;
