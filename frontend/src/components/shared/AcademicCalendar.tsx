"use client";

import React, { useState } from 'react';
import './AcademicCalendar.css';

interface CalendarEvent {
  name: string;
  type: 'holiday' | 'jayanti';
  status: string;
  dateStr: string;
  startDay: number;
  endDay: number;
}

// Database of SJS Academic Calendar 2026-2027
const CALENDAR_DATA: { [key: string]: CalendarEvent[] } = {
  // Months are 0-indexed (3 = April, 4 = May, etc.)
  "2026-3": [ // April 2026
    { name: "Ambedkar Jayantee", type: "holiday", status: "Central Holiday", dateStr: "14.04.2026", startDay: 14, endDay: 14 },
    { name: "Baba BR Ambedkar", type: "jayanti", status: "Central Holiday", dateStr: "14.04.2026", startDay: 14, endDay: 14 },
    { name: "Swami Surdas", type: "jayanti", status: "State Holiday", dateStr: "21.04.2026", startDay: 21, endDay: 21 }
  ],
  "2026-4": [ // May 2026
    { name: "Bhagwan Buddha", type: "jayanti", status: "State Holiday", dateStr: "01.05.2026", startDay: 1, endDay: 1 },
    { name: "Bakreed / Eid-Ul-Azha", type: "holiday", status: "State Holiday", dateStr: "27.05.2026", startDay: 27, endDay: 27 },
    { name: "Summer Vacation (Pre-Primary to Junior)", type: "holiday", status: "State Holiday", dateStr: "18.05.2026 - 26.06.2026", startDay: 18, endDay: 31 }
  ],
  "2026-5": [ // June 2026
    { name: "Summer Vacation (Pre-Primary to Junior)", type: "holiday", status: "State Holiday", dateStr: "18.05.2026 - 26.06.2026", startDay: 1, endDay: 26 },
    { name: "Summer Vacation (Senior)", type: "holiday", status: "State Holiday", dateStr: "01.06.2026 - 26.06.2026", startDay: 1, endDay: 26 },
    { name: "Yog Diwas", type: "jayanti", status: "State Holiday", dateStr: "21.06.2026", startDay: 21, endDay: 21 },
    { name: "Moharram", type: "holiday", status: "State Holiday", dateStr: "26.06.2026", startDay: 26, endDay: 26 },
    { name: "Swami Kabeer Das", type: "jayanti", status: "State Holiday", dateStr: "29.06.2026", startDay: 29, endDay: 29 }
  ],
  "2026-6": [], // July 2026
  "2026-7": [ // August 2026
    { name: "Independence Day", type: "jayanti", status: "Central Holiday", dateStr: "15.08.2026", startDay: 15, endDay: 15 },
    { name: "Swami Tulsidas", type: "jayanti", status: "State Holiday", dateStr: "19.08.2026", startDay: 19, endDay: 19 },
    { name: "Rajeev Gandhi", type: "jayanti", status: "State Holiday", dateStr: "20.08.2026", startDay: 20, endDay: 20 },
    { name: "Rakshabandhan", type: "holiday", status: "State Holiday", dateStr: "28.08.2026", startDay: 28, endDay: 28 },
    { name: "Major Dhyanchanda", type: "jayanti", status: "State Holiday", dateStr: "29.08.2026", startDay: 29, endDay: 29 }
  ],
  "2026-8": [ // September 2026
    { name: "Sri Krishna Janmashtami", type: "holiday", status: "State Holiday", dateStr: "04.09.2026", startDay: 4, endDay: 4 },
    { name: "Dr. S. Radhakrishnan (Teacher's Day)", type: "jayanti", status: "State Holiday", dateStr: "05.09.2026", startDay: 5, endDay: 5 },
    { name: "Hartalika Teej (Half Day-All)", type: "holiday", status: "State Holiday", dateStr: "14.09.2026", startDay: 14, endDay: 14 }
  ],
  "2026-9": [ // October 2026
    { name: "Mahatma Gandhi / Lal Bahadur Shastri", type: "jayanti", status: "Central Holiday", dateStr: "02.10.2026", startDay: 2, endDay: 2 },
    { name: "Durga Pooja / Vijaydashami", type: "holiday", status: "State Holiday", dateStr: "17.10.2026 - 20.10.2026", startDay: 17, endDay: 20 },
    { name: "Swami Valmiki (Sarad Poornima)", type: "jayanti", status: "State Holiday", dateStr: "25.10.2026", startDay: 25, endDay: 25 },
    { name: "Karwachauth (Half Day-All)", type: "holiday", status: "State Holiday", dateStr: "29.10.2026", startDay: 29, endDay: 29 },
    { name: "Sardar Vallabh Bhai Patel", type: "jayanti", status: "State Holiday", dateStr: "31.10.2026", startDay: 31, endDay: 31 }
  ],
  "2026-10": [ // November 2026
    { name: "Deepawali & Bhaiya Dooj", type: "holiday", status: "State Holiday", dateStr: "07.11.2026 - 11.11.2026", startDay: 7, endDay: 11 },
    { name: "Jawahar Lal Nehru / Children's Day", type: "jayanti", status: "State Holiday", dateStr: "14.11.2026", startDay: 14, endDay: 14 },
    { name: "Indira Gandhi", type: "jayanti", status: "State Holiday", dateStr: "19.11.2026", startDay: 19, endDay: 19 },
    { name: "Kartik Poornima/Guru Nanak Jayantee", type: "holiday", status: "State Holiday", dateStr: "24.11.2026", startDay: 24, endDay: 24 }
  ],
  "2026-11": [ // December 2026
    { name: "Dr. Rajendra Prasad", type: "jayanti", status: "State Holiday", dateStr: "03.12.2026", startDay: 3, endDay: 3 },
    { name: "X-Mas", type: "holiday", status: "Central Holiday", dateStr: "25.12.2026", startDay: 25, endDay: 25 },
    { name: "Winter Vacation", type: "holiday", status: "State Holiday", dateStr: "26.12.2026 - 31.12.2026", startDay: 26, endDay: 31 },
    { name: "Guru Govind Singh", type: "jayanti", status: "State Holiday", dateStr: "30.12.2026", startDay: 30, endDay: 30 }
  ],
  "2027-0": [ // January 2027
    { name: "Swami Vivekanand", type: "jayanti", status: "State Holiday", dateStr: "12.01.2027", startDay: 12, endDay: 12 },
    { name: "Makar Sankranti", type: "holiday", status: "State Holiday", dateStr: "15.01.2027", startDay: 15, endDay: 15 },
    { name: "Subhash Chandra Bose", type: "jayanti", status: "State Holiday", dateStr: "23.01.2027", startDay: 23, endDay: 23 },
    { name: "Republic Day", type: "jayanti", status: "Central Holiday", dateStr: "26.01.2027", startDay: 26, endDay: 26 }
  ],
  "2027-1": [], // February 2027
  "2027-2": [ // March 2027
    { name: "Maha Shivratri", type: "holiday", status: "State Holiday", dateStr: "06.03.2027", startDay: 6, endDay: 6 },
    { name: "Eid", type: "holiday", status: "State Holiday", dateStr: "10.03.2027", startDay: 10, endDay: 10 },
    { name: "Holi", type: "holiday", status: "State Holiday", dateStr: "22.03.2027 - 24.03.2027", startDay: 22, endDay: 24 }
  ]
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AcademicCalendar() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // Start at July (0-indexed = 6)
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const key = `${currentYear}-${currentMonth}`;
  const events = CALENDAR_DATA[key] || [];

  // Get number of days in the current month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get weekday of the 1st day of the month
  const getFirstWeekday = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstWeekday = getFirstWeekday(currentYear, currentMonth);

  // Navigate months
  const handlePrevMonth = () => {
    setSelectedDay(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDay(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Check if day has event
  const getDayEvents = (day: number) => {
    return events.filter(e => day >= e.startDay && day <= e.endDay);
  };

  // Render the calendar grid
  const renderGrid = () => {
    const gridCells = [];

    // Prepend empty blank slots for the offset of first weekday
    // (Ensure they have absolutely no text/number to fit "no prev extra days")
    for (let i = 0; i < firstWeekday; i++) {
      gridCells.push(
        <div key={`empty-${i}`} className="calendar-grid-cell empty"></div>
      );
    }

    // Render 1 to N days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getDayEvents(day);
      const isHoliday = dayEvents.some(e => e.type === 'holiday');
      const isJayanti = dayEvents.some(e => e.type === 'jayanti');

      let cellClass = "calendar-grid-cell day-cell";
      if (selectedDay === day) cellClass += " selected";
      if (isHoliday && isJayanti) cellClass += " event-mixed";
      else if (isHoliday) cellClass += " event-holiday";
      else if (isJayanti) cellClass += " event-jayanti";

      gridCells.push(
        <button
          key={`day-${day}`}
          className={cellClass}
          onClick={() => setSelectedDay(day)}
        >
          <span className="day-number">{day}</span>
          {(isHoliday || isJayanti) && (
            <div className="event-indicators">
              {isHoliday && <span className="dot dot-holiday"></span>}
              {isJayanti && <span className="dot dot-jayanti"></span>}
            </div>
          )}
        </button>
      );
    }

    return gridCells;
  };

  const selectedDayEvents = selectedDay ? getDayEvents(selectedDay) : [];

  return (
    <div className="academic-calendar-wrapper">
      {/* Calendar Header with Navigation */}
      <div className="calendar-nav-header">
        <button className="nav-arrow-btn" onClick={handlePrevMonth}>
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="month-year-title">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </div>
        <button className="nav-arrow-btn" onClick={handleNextMonth}>
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="calendar-weekdays">
        {WEEKDAYS.map(w => (
          <div key={w} className="weekday-label">{w}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="calendar-days-grid">
        {renderGrid()}
      </div>

      {/* Selected Date Details Panel */}
      {selectedDay && (
        <div className="selected-day-details">
          <h4 className="details-header">
            📅 {selectedDay} {MONTH_NAMES[currentMonth]} {currentYear}
          </h4>
          {selectedDayEvents.length === 0 ? (
            <p className="no-events-text">Regular School Day</p>
          ) : (
            <div className="details-events-list">
              {selectedDayEvents.map((e, idx) => (
                <div 
                  key={idx} 
                  className={`detail-event-card ${e.type}`}
                >
                  <div className="event-card-type">
                    {e.type === 'holiday' ? '🏫 Holiday' : '✨ Jayanti / Occasion'}
                  </div>
                  <div className="event-card-name">{e.name}</div>
                  <div className="event-card-status">{e.status} ({e.dateStr})</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Monthly Holidays & Jayantis Directory */}
      <div className="monthly-directory">
        <h3 className="directory-title">
          📌 Events & Holidays in {MONTH_NAMES[currentMonth]}
        </h3>
        
        {events.length === 0 ? (
          <div className="directory-empty-state">
            <i className="fa-regular fa-calendar-minus"></i>
            <p>No holidays or occasions listed for this month.</p>
          </div>
        ) : (
          <div className="directory-list">
            {events.map((e, idx) => (
              <div 
                key={idx} 
                className={`directory-item-card ${e.type}`}
              >
                <div className="directory-item-badge">
                  {e.type === 'holiday' ? 'Holiday' : 'Occasion'}
                </div>
                <div className="directory-item-info">
                  <div className="directory-item-name">{e.name}</div>
                  <div className="directory-item-status">{e.status}</div>
                </div>
                <div className="directory-item-date">{e.dateStr}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
