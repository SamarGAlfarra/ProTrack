import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import './Calendar.css';

const Calendar = ({ onDateTimeSelect, onClear, onDone }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2020, 6, 10)); // July 2020, 10th day
  const [selectedDate, setSelectedDate] = useState(new Date(2020, 6, 10, 9, 0));
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to be last (6)
  };

  const getPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day, isCurrentMonth = true) => {
    if (isCurrentMonth) {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, selectedHour, selectedMinute);
      setSelectedDate(newDate);
      onDateTimeSelect?.(newDate);
    }
  };

  const handleTimeChange = (hour, minute) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    if (selectedDate) {
      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, minute);
      setSelectedDate(newDate);
      onDateTimeSelect?.(newDate);
    }
  };

  const handleClear = () => {
    setSelectedDate(null);
    setShowTimePicker(false);
    onClear?.();
  };

  const handleDone = () => {
    setShowTimePicker(false);
    onDone?.();
  };

  const handleDateInputChange = (e) => {
    const inputValue = e.target.value;
    if (inputValue) {
      const [datePart, timePart] = inputValue.split(', ');
      if (datePart && timePart) {
        const [day, month, year] = datePart.split('.');
        const [hours, minutes] = timePart.split(':');
        
        const newDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        );
        
        if (!isNaN(newDate.getTime())) {
          setSelectedDate(newDate);
          setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
          setSelectedHour(newDate.getHours());
          setSelectedMinute(newDate.getMinutes());
          onDateTimeSelect?.(newDate);
        }
      }
    }
  };

  const formatSelectedDate = (date) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  };

  const generateTimeOptions = () => {
    const hours = [];
    const minutes = [];
    
    for (let h = 0; h < 24; h++) {
      hours.push(h);
    }
    
    for (let m = 0; m < 60; m += 15) {
      minutes.push(m);
    }
    
    return { hours, minutes };
  };

  const { hours, minutes } = generateTimeOptions();

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysInPrevMonth = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    
    const days = [];

    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push(
        <button
          key={`prev-${day}`}
          className="calendar-day calendar-day-other"
        >
          {day}
        </button>
      );
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate?.getDate() === day && 
                        selectedDate?.getMonth() === currentDate.getMonth() && 
                        selectedDate?.getFullYear() === currentDate.getFullYear();
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`calendar-day ${isSelected ? 'calendar-day-selected' : 'calendar-day-current'}`}
        >
          {day}
        </button>
      );
    }

    // Next month's days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <button
          key={`next-${day}`}
          className="calendar-day calendar-day-other"
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <button 
          onClick={getPreviousMonth}
          className="nav-button"
        >
          <ChevronLeft size={20} />
        </button>
        
        <h2 className="calendar-title">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <button 
          onClick={getNextMonth}
          className="nav-button"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Days of week */}
      <div className="days-of-week">
        {daysOfWeek.map(day => (
          <div key={day} className="day-of-week">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid">
        {renderCalendarDays()}
      </div>

      {/* Selected date display */}
      <div className="selected-date">
        <input
          type="text"
          value={formatSelectedDate(selectedDate)}
          onChange={handleDateInputChange}
          className="date-input"
          placeholder="DD.MM.YYYY, HH:MM"
        />
        {selectedDate && (
            <Clock size={14} />
        )}
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        <button
          onClick={handleClear}
          className="action-button clear-button"
        >
          Clear
        </button>
        <button
          onClick={handleDone}
          className="action-button done-button"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default Calendar;