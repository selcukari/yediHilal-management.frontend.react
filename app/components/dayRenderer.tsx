import dayjs from 'dayjs';
import { Indicator } from '@mantine/core';
import { type DatePickerProps } from '@mantine/dates';

export const DayRenderer: DatePickerProps['renderDay'] = (date) => {
  const today = new Date();
  const isToday = dayjs(date).isSame(today, 'day');
  const day = new Date(date).getDate();

  if (isToday) {
    return (
      <Indicator size={6} color="blue" offset={-5}>
        <div>{day}</div>
      </Indicator>
    );
  }

  return <div>{day}</div>;
};