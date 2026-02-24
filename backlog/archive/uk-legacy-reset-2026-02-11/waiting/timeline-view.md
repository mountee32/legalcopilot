On the case view and timeline and calander views we want to replace them both with a new timeline view:

here is a mockup

import React, { useState, useMemo } from 'react';

// Sample data based on the screenshot
const events = [
{
id: 1,
date: '2025-11-10',
title: 'AI: Title analysis complete',
description: 'AI reviewed title deeds. Property is freehold with no restrictive covenants affecting proposed use.',
type: 'ai',
icon: '🤖'
},
{
id: 2,
date: '2025-11-13',
title: 'Enquiries raised',
description: '15 preliminary enquiries sent to seller\'s solicitors regarding boundaries, disputes, and alterations.',
type: 'document',
icon: '📋'
},
{
id: 3,
date: '2025-11-20',
title: 'Search results received',
description: 'All searches returned clear. No adverse entries.',
type: 'document',
icon: '📄'
},
{
id: 4,
date: '2025-11-27',
title: 'Enquiry replies received',
description: 'Seller\'s solicitors responded to all 15 enquiries. Reviewing for completeness.',
type: 'email',
icon: '✉️'
},
{
id: 5,
date: '2025-12-04',
title: 'Mortgage offer received',
description: 'Nationwide mortgage offer received. £680,000 advance at 4.25% fixed for 5 years.',
type: 'document',
icon: '🏦'
},
{
id: 6,
date: '2025-12-08',
title: 'Report on title sent to client',
description: 'Comprehensive report on title sent to Mrs Thompson with contract for signature.',
type: 'email',
icon: '📧'
},
{
id: 7,
date: '2025-12-18',
title: 'Client queries received',
description: 'Mrs Thompson raised 3 questions about the lease terms and service charges.',
type: 'email',
icon: '❓'
},
// Future events
{
id: 8,
date: '2025-12-20',
title: 'Contract signing deadline',
description: 'Client to return signed contract and deposit funds.',
type: 'task',
icon: '✍️',
isFuture: true
},
{
id: 9,
date: '2025-12-22',
title: 'Deposit transfer',
description: 'Transfer 10% deposit to seller\'s solicitors.',
type: 'task',
icon: '💷',
isFuture: true
},
{
id: 10,
date: '2025-12-23',
title: 'Exchange of contracts',
description: 'Target date for exchange with seller\'s solicitors.',
type: 'milestone',
icon: '🔄',
isFuture: true
},
{
id: 11,
date: '2026-01-10',
title: 'Completion',
description: 'Target completion date. Keys handed over to client.',
type: 'milestone',
icon: '🏠',
isFuture: true
}
];

const TODAY = '2025-12-18';

export default function LegalTimeline() {
const [hoveredEvent, setHoveredEvent] = useState(null);
const [viewMode, setViewMode] = useState('proportional');

const parseDate = (dateStr) => new Date(dateStr);
const today = parseDate(TODAY);

// Get date range with padding
const allDates = events.map(e => parseDate(e.date));
const minDate = new Date(Math.min(...allDates));
const maxDate = new Date(Math.max(...allDates));
minDate.setDate(minDate.getDate() - 5);
maxDate.setDate(maxDate.getDate() + 5);

const totalDays = (maxDate - minDate) / (1000 _ 60 _ 60 \* 24);

const getPosition = (dateStr) => {
const date = parseDate(dateStr);
const daysFromStart = (date - minDate) / (1000 _ 60 _ 60 _ 24);
return (daysFromStart / totalDays) _ 100;
};

const todayPosition = getPosition(TODAY);

// Smart collision-avoidance layout algorithm
const layoutEvents = useMemo(() => {
const CARD_WIDTH_PERCENT = 12; // Approximate width of card as % of timeline
const LANE_HEIGHT = 70; // Pixels per lane
const LANES_ABOVE = 3; // Number of lanes above the axis
const LANES_BELOW = 3; // Number of lanes below the axis

    // Sort events by date
    const sortedEvents = [...events].sort((a, b) =>
      parseDate(a.date) - parseDate(b.date)
    );

    // Track occupied ranges per lane
    // Lanes: -3, -2, -1 (above axis), 1, 2, 3 (below axis)
    const laneOccupancy = {};
    for (let i = -LANES_ABOVE; i <= LANES_BELOW; i++) {
      if (i !== 0) laneOccupancy[i] = [];
    }

    // Check if a position range overlaps with existing items in a lane
    const isLaneAvailable = (lane, startPos, endPos) => {
      return !laneOccupancy[lane].some(([occStart, occEnd]) =>
        !(endPos < occStart || startPos > occEnd)
      );
    };

    // Find the best lane for an event (closest to axis that's available)
    const findBestLane = (startPos, endPos) => {
      // Alternate checking above and below, starting closest to axis
      const laneOrder = [1, -1, 2, -2, 3, -3];

      for (const lane of laneOrder) {
        if (isLaneAvailable(lane, startPos, endPos)) {
          return lane;
        }
      }
      // Fallback: return the lane with least recent conflict
      return 1;
    };

    // Assign lanes to events
    return sortedEvents.map(event => {
      const position = getPosition(event.date);
      const startPos = position - CARD_WIDTH_PERCENT / 2;
      const endPos = position + CARD_WIDTH_PERCENT / 2;

      const lane = findBestLane(startPos, endPos);

      // Mark this range as occupied
      laneOccupancy[lane].push([startPos, endPos]);

      return {
        ...event,
        position,
        lane,
        verticalOffset: lane * LANE_HEIGHT
      };
    });

}, []);

// Calculate required height based on lanes used
const maxLane = Math.max(...layoutEvents.map(e => Math.abs(e.lane)));
const timelineHeight = (maxLane _ 2 + 1) _ 70 + 40;

const getMonthKey = (dateStr) => {
const date = parseDate(dateStr);
return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const months = [...new Set(events.map(e => getMonthKey(e.date)))].sort();

const getMonthName = (monthKey) => {
const [year, month] = monthKey.split('-');
return new Date(year, parseInt(month) - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

const getMonthBounds = (monthKey) => {
const [year, month] = monthKey.split('-');
const start = new Date(year, parseInt(month) - 1, 1);
const end = new Date(year, parseInt(month), 0);
return {
start: Math.max(0, getPosition(start.toISOString().split('T')[0])),
end: Math.min(100, getPosition(end.toISOString().split('T')[0]))
};
};

const typeColors = {
ai: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700', line: 'bg-purple-300' },
document: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', line: 'bg-blue-300' },
email: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700', line: 'bg-green-300' },
task: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700', line: 'bg-amber-300' },
milestone: { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-700', line: 'bg-rose-300' }
};

const formatDate = (dateStr) => {
return parseDate(dateStr).toLocaleDateString('en-GB', {
day: 'numeric',
month: 'short',
year: 'numeric'
});
};

const getDaysFromToday = (dateStr) => {
const date = parseDate(dateStr);
const diff = Math.round((date - today) / (1000 _ 60 _ 60 \* 24));
if (diff === 0) return 'Today';
if (diff === 1) return 'Tomorrow';
if (diff === -1) return 'Yesterday';
if (diff > 0) return `In ${diff} days`;
return `${Math.abs(diff)} days ago`;
};

return (

<div className="min-h-screen bg-slate-50 p-8">
<div className="max-w-7xl mx-auto">
{/_ Header _/}
<div className="mb-8">
<div className="flex items-center gap-2 text-sm text-slate-500 mb-2 cursor-pointer hover:text-slate-700">
<span>←</span> Back to Cases
</div>
<div className="flex items-center gap-3 mb-1">
<span className="text-sm text-slate-500 font-mono">MAT-DEMO-001</span>
<span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">ACTIVE</span>
</div>
<h1 className="text-2xl font-semibold text-slate-800">Purchase of 15 Willow Lane, Richmond</h1>
<p className="text-slate-500 text-sm mt-1">CONVEYANCING</p>
</div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('proportional')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'proportional'
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            ⏱️ Time-Proportional
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'compact'
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            📋 Compact List
          </button>
        </div>

        {/* Timeline Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-x-auto">

          {viewMode === 'proportional' ? (
            <div className="min-w-[900px]">
              {/* Month Labels */}
              <div className="relative h-8 mb-2">
                {months.map((monthKey) => {
                  const bounds = getMonthBounds(monthKey);
                  return (
                    <div
                      key={monthKey}
                      className="absolute text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded"
                      style={{ left: `${bounds.start}%` }}
                    >
                      {getMonthName(monthKey)}
                    </div>
                  );
                })}
              </div>

              {/* Main Timeline Track */}
              <div className="relative" style={{ height: `${timelineHeight}px` }}>
                {/* Month background bands */}
                {months.map((monthKey, idx) => {
                  const bounds = getMonthBounds(monthKey);
                  return (
                    <div
                      key={monthKey}
                      className={`absolute top-0 bottom-0 ${idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}`}
                      style={{
                        left: `${bounds.start}%`,
                        width: `${bounds.end - bounds.start}%`
                      }}
                    />
                  );
                })}

                {/* Central timeline axis */}
                <div
                  className="absolute left-0 right-0 h-1.5 bg-slate-200 rounded-full"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                >
                  {/* Past segment */}
                  <div
                    className="absolute top-0 left-0 h-full bg-slate-400 rounded-l-full"
                    style={{ width: `${todayPosition}%` }}
                  />
                  {/* Future segment */}
                  <div
                    className="absolute top-0 h-full bg-gradient-to-r from-blue-400 to-blue-200 rounded-r-full"
                    style={{ left: `${todayPosition}%`, right: 0 }}
                  />
                </div>

                {/* TODAY marker */}
                <div
                  className="absolute top-0 bottom-0 z-20 flex flex-col items-center"
                  style={{ left: `${todayPosition}%`, transform: 'translateX(-50%)' }}
                >
                  {/* Top label */}
                  <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    📍 TODAY
                  </div>
                  {/* Vertical line */}
                  <div className="flex-1 w-0.5 bg-red-400 my-1" />
                  {/* Bottom date */}
                  <div className="text-xs text-red-600 font-medium whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm">
                    {formatDate(TODAY)}
                  </div>
                </div>

                {/* Event nodes with smart positioning */}
                {layoutEvents.map((event) => {
                  const isPast = parseDate(event.date) < today;
                  const isToday = event.date === TODAY;
                  const colors = typeColors[event.type];
                  const isAbove = event.lane < 0;

                  // Calculate connector line length
                  const connectorLength = Math.abs(event.verticalOffset) - 24;

                  return (
                    <div
                      key={event.id}
                      className="absolute transform -translate-x-1/2 z-10"
                      style={{
                        left: `${event.position}%`,
                        top: '50%',
                        transform: `translate(-50%, ${event.verticalOffset}px)`
                      }}
                    >
                      {/* Connector line to axis */}
                      <div
                        className={`absolute left-1/2 w-0.5 -translate-x-1/2 ${colors.line}`}
                        style={{
                          [isAbove ? 'bottom' : 'top']: '100%',
                          height: `${connectorLength}px`
                        }}
                      />

                      {/* Dot on axis */}
                      <div
                        className={`absolute left-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm -translate-x-1/2 ${
                          isPast ? 'bg-slate-400' : 'bg-blue-500'
                        }`}
                        style={{
                          [isAbove ? 'bottom' : 'top']: `calc(100% + ${connectorLength}px)`
                        }}
                      />

                      {/* Event card */}
                      <div
                        className={`
                          relative flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer
                          ${colors.bg} ${colors.border}
                          ${isPast ? 'opacity-75' : 'opacity-100'}
                          ${isToday ? 'ring-2 ring-red-400 ring-offset-2' : ''}
                          ${hoveredEvent === event.id ? 'scale-105 shadow-xl z-30' : 'shadow-md hover:shadow-lg'}
                          transition-all duration-200
                        `}
                        onMouseEnter={() => setHoveredEvent(event.id)}
                        onMouseLeave={() => setHoveredEvent(null)}
                      >
                        <span className="text-lg flex-shrink-0">{event.icon}</span>
                        <div className="min-w-0">
                          <div className={`text-xs font-semibold ${colors.text} truncate max-w-[120px]`}>
                            {event.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {getDaysFromToday(event.date)}
                          </div>
                        </div>

                        {/* Expanded tooltip */}
                        {hoveredEvent === event.id && (
                          <div
                            className={`absolute ${isAbove ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 transform -translate-x-1/2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-40`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{event.icon}</span>
                              <span className={`text-sm font-semibold ${colors.text}`}>{event.title}</span>
                              {event.type === 'ai' && (
                                <span className="px-2 py-0.5 bg-purple-200 text-purple-700 text-xs rounded-full">AI</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{event.description}</p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">{formatDate(event.date)}</span>
                              <span className={`font-medium ${isPast ? 'text-slate-500' : 'text-blue-600'}`}>
                                {getDaysFromToday(event.date)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap gap-4 justify-center">
                  {Object.entries(typeColors).map(([type, colors]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-lg ${colors.bg} border-2 ${colors.border}`} />
                      <span className="text-xs text-slate-600 capitalize font-medium">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Compact List View */
            <div className="space-y-2">
              {events.sort((a, b) => parseDate(a.date) - parseDate(b.date)).map((event, idx, arr) => {
                const isPast = parseDate(event.date) < today;
                const isToday = event.date === TODAY;
                const colors = typeColors[event.type];
                const prevEvent = arr[idx - 1];
                const daysSincePrev = prevEvent
                  ? Math.round((parseDate(event.date) - parseDate(prevEvent.date)) / (1000 * 60 * 60 * 24))
                  : 0;

                const currentMonth = getMonthKey(event.date);
                const prevMonth = prevEvent ? getMonthKey(prevEvent.date) : null;
                const showMonthHeader = currentMonth !== prevMonth;

                const todayBetween = prevEvent &&
                  parseDate(prevEvent.date) < today &&
                  parseDate(event.date) > today;

                return (
                  <React.Fragment key={event.id}>
                    {showMonthHeader && (
                      <div className="py-2 px-4 bg-slate-100 rounded-lg text-sm font-semibold text-slate-600">
                        {getMonthName(currentMonth)}
                      </div>
                    )}

                    {todayBetween && (
                      <div className="flex items-center gap-4 py-3">
                        <div className="flex-1 h-0.5 bg-red-400" />
                        <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          📍 TODAY · {formatDate(TODAY)}
                        </div>
                        <div className="flex-1 h-0.5 bg-red-400" />
                      </div>
                    )}

                    {daysSincePrev > 3 && !showMonthHeader && !todayBetween && (
                      <div className="flex items-center justify-center py-1">
                        <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                          {daysSincePrev} days
                        </div>
                      </div>
                    )}

                    <div className={`
                      flex items-start gap-4 p-4 rounded-xl border-2 transition-all
                      ${colors.bg} ${colors.border}
                      ${isPast ? 'opacity-75' : ''}
                      ${isToday ? 'ring-2 ring-red-400' : ''}
                      hover:shadow-md cursor-pointer
                    `}>
                      <div className="text-2xl">{event.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${colors.text}`}>{event.title}</h3>
                          {event.type === 'ai' && (
                            <span className="px-2 py-0.5 bg-purple-200 text-purple-700 text-xs rounded-full">AI</span>
                          )}
                          {isToday && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">Today</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{formatDate(event.date)}</span>
                          <span className={`font-medium ${isPast ? 'text-slate-500' : 'text-blue-600'}`}>
                            {getDaysFromToday(event.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="text-2xl font-bold text-slate-800">
              {events.filter(e => parseDate(e.date) < today).length}
            </div>
            <div className="text-sm text-slate-500">Events completed</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="text-2xl font-bold text-blue-600">
              {events.filter(e => parseDate(e.date) >= today).length}
            </div>
            <div className="text-sm text-slate-500">Upcoming</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="text-2xl font-bold text-slate-800">
              {Math.round((today - parseDate(events[0].date)) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-sm text-slate-500">Days in progress</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="text-2xl font-bold text-emerald-600">
              {Math.round((parseDate(events[events.length - 1].date) - today) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-sm text-slate-500">Days to completion</div>
          </div>
        </div>
      </div>
    </div>

);
}

Case Timeline View - Acceptance Criteria
Feature: Time-Proportional Case Timeline
Module: Cases > Timeline Tab
Version: 1.0
Date: 18 December 2025
Author: Product Team

1. Overview
   Replace the existing linear event list with a time-aware timeline visualisation that gives users an intuitive sense of elapsed time, current position within the matter lifecycle, and upcoming milestones.
   Business Value

Solicitors can instantly see periods of activity vs inactivity
Clear visual distinction between completed and upcoming work
"Where are we now?" answered at a glance
Highlights clustering of deadlines (e.g. exchange week)

2. User Stories
   IDAs a...I want to...So that...US-01SolicitorSee events positioned according to actual calendar timeI understand the true pace and rhythm of a matterUS-02SolicitorSee a clear "today" marker on the timelineI know exactly where we are in the matter lifecycleUS-03SolicitorDistinguish past events from future eventsI can focus on what's coming without losing context of what's doneUS-04SolicitorView event details on hover/clickI can get full context without leaving the timelineUS-05SolicitorSwitch between timeline and list viewsI can use whichever format suits my current taskUS-06Case ManagerSee events grouped by monthI can navigate longer matters more easilyUS-07SolicitorSee relative time labels ("3 days ago", "In 5 days")I don't have to mentally calculate time distances

3. Functional Requirements
   3.1 View Modes
   FR-01: System SHALL provide two view modes:

Time-Proportional (horizontal timeline) - DEFAULT
Compact List (vertical chronological list)

FR-02: User's view mode preference SHALL persist within the session.
FR-03: View toggle SHALL be clearly accessible above the timeline area.

3.2 Time-Proportional View (Horizontal Timeline)
3.2.1 Axis & Time Scale
FR-10: Horizontal axis SHALL represent calendar time from (earliest event - 5 days) to (latest event + 5 days).
FR-11: Event horizontal position SHALL be calculated as:
position % = (event_date - min_date) / (max_date - min_date) × 100
FR-12: The axis SHALL display:

Past segment: solid darker colour (slate/grey)
Future segment: gradient lighter colour (blue)
Clear visual distinction at the "today" intersection point

3.2.2 Today Marker
FR-20: A vertical "TODAY" marker SHALL be displayed at the current date position.
FR-21: Today marker SHALL include:

Vertical line spanning full timeline height
Label reading "TODAY" (with pin/location icon)
Current date displayed below in human-readable format (e.g. "18 Dec 2025")

FR-22: Today marker SHALL have highest z-index (always visible, never obscured).
FR-23: If an event occurs on today's date, that event SHALL have additional visual emphasis (ring/glow effect).
3.2.3 Month Grouping
FR-30: Timeline background SHALL display alternating subtle bands per calendar month.
FR-31: Month labels SHALL appear above the timeline showing "Month Year" (e.g. "November 2025").
FR-32: Month boundaries SHALL align to 1st and last day of each month.
3.2.4 Event Cards
FR-40: Each event SHALL be displayed as a card containing:

Event type icon (emoji or icon)
Event title (truncated to ~20 characters with ellipsis)
Relative time label (e.g. "3 days ago", "In 5 days", "Today", "Yesterday", "Tomorrow")

FR-41: Event cards SHALL be colour-coded by event type:
TypeBackgroundBorderUse CaseAIPurple tintPurpleAI-generated analysis, suggestionsDocumentBlue tintBlueDocuments received/sentEmailGreen tintGreenEmail correspondenceTaskAmber tintAmberAction items, deadlinesMilestoneRose/Red tintRoseKey matter milestones
FR-42: Past events SHALL have reduced opacity (70-80%) compared to future events.
FR-43: Each event card SHALL connect to the central axis via a vertical connector line matching the event type colour.
FR-44: A small dot SHALL appear on the axis at the exact temporal position of each event.
3.2.5 Collision Avoidance (Critical)
FR-50: Events SHALL NOT visually overlap each other.
FR-51: System SHALL implement lane-based positioning:

Minimum 3 lanes above the central axis
Minimum 3 lanes below the central axis
Lane height: approximately 70px

FR-52: Lane allocation algorithm:

Sort events by date (ascending)
For each event, calculate its horizontal span (position ± card width %)
Check lanes in priority order: 1, -1, 2, -2, 3, -3 (closest to axis first)
Assign event to first lane where its span doesn't overlap existing events
Mark that span as occupied in the assigned lane

FR-53: Timeline container height SHALL dynamically adjust based on maximum lanes used.
FR-54: If events are extremely clustered, system MAY add additional lanes (4, -4, etc.) rather than overlap.
3.2.6 Hover/Interaction
FR-60: On hover, event card SHALL:

Scale up slightly (105%)
Increase shadow depth
Increase z-index (appear above neighbours)

FR-61: On hover, an expanded tooltip SHALL appear containing:

Full event title (not truncated)
Event type badge (for AI events)
Full description text
Absolute date (e.g. "8 Dec 2025")
Relative time label

FR-62: Tooltip SHALL appear above the card if card is below axis, and below if card is above axis (avoid viewport overflow).
FR-63: On click, system SHALL navigate to event detail or open event modal (defer to existing UX pattern).

3.3 Compact List View
FR-70: Events SHALL be displayed in chronological order (oldest first).
FR-71: Events SHALL be grouped under month headers ("November 2025", "December 2025").
FR-72: A "TODAY" divider SHALL appear between the last past event and first future event, showing:

Horizontal lines either side
"TODAY · [date]" label centred

FR-73: Time gap indicators SHALL appear between events separated by more than 3 days:

Small pill/badge showing "[X] days"
Does not appear if a month header is already shown

FR-74: Each list item SHALL display:

Event type icon (larger than timeline view)
Event title
Type badge (for AI events)
"Today" badge (if applicable)
Full description
Absolute date
Relative time label

FR-75: Past events SHALL have reduced opacity.
FR-76: Today's event(s) SHALL have a highlight ring.

3.4 Summary Statistics Panel
FR-80: Below the timeline, display a 4-column statistics bar:
StatCalculationColourEvents completedCount where event_date < todaySlate/darkUpcomingCount where event_date >= todayBlueDays in progresstoday - earliest_event_dateSlate/darkDays to completionlatest_event_date - todayGreen
FR-81: If no future events exist, "Days to completion" SHALL display "—" or "Complete".

4. Data Requirements
   4.1 Event Object Schema
   typescriptinterface TimelineEvent {
   id: string;
   date: string; // ISO 8601 date (YYYY-MM-DD)
   title: string; // Max 100 characters
   description: string; // Max 500 characters
   type: 'ai' | 'document' | 'email' | 'task' | 'milestone';
   icon?: string; // Optional emoji or icon identifier
   metadata?: {
   createdBy?: string;
   linkedDocumentId?: string;
   linkedTaskId?: string;
   };
   }
   4.2 API Requirements
   FR-90: Timeline SHALL fetch events via existing case events endpoint.
   FR-91: Events SHALL be filterable by type (future enhancement - not MVP).
   FR-92: System SHALL handle cases with 0 events gracefully (empty state).
   FR-93: System SHALL handle cases with 100+ events (scroll/zoom - future enhancement).

5. Edge Cases & Validation
   ScenarioExpected BehaviourNo events on caseDisplay empty state: "No events yet"All events in pastToday marker appears at far right; "Upcoming: 0"All events in futureToday marker appears at far left; "Completed: 0"Single eventDisplay timeline with that event; stats show 0/1 or 1/0Events on same dayStack in different lanes; same horizontal positionEvent on today's dateHighlighted with ring; appears in both completed/upcoming counts appropriatelyVery long titleTruncate with ellipsis on card; full title in tooltipDate range > 1 yearConsider adding zoom controls (future enhancement)

6. UI/Visual Specifications
   6.1 Colours (Tailwind Classes)
   ElementLight ModeBackgroundslate-50Card backgroundwhiteCard borderslate-200Axis (past)slate-400Axis (future)blue-400 → blue-200 gradientToday markerred-500Today label bgred-500Month band (even)slate-50 @ 70% opacityMonth band (odd)white
   6.2 Typography
   ElementSizeWeightCase titletext-2xlsemiboldMonth headerstext-xssemiboldEvent card titletext-xssemiboldEvent card subtitletext-xsnormalTooltip titletext-smsemiboldTooltip descriptiontext-smnormalStats numbertext-2xlboldStats labeltext-smnormal
   6.3 Spacing & Sizing
   ElementValueTimeline container padding24px (p-6)Lane height70pxEvent card padding8px 12pxEvent card border radius12px (rounded-xl)Connector line width2pxAxis line height6pxAxis dot size12px
   6.4 Transitions
   InteractionDurationEasingCard hover scale200msease-outCard hover shadow200msease-outView mode switch300msease-in-outTooltip appear150msease-out

7. Accessibility Requirements
   ACC-01: All interactive elements SHALL be keyboard accessible (Tab navigation).
   ACC-02: Event cards SHALL have appropriate ARIA labels: aria-label="[Event title], [Event type], [Relative date]".
   ACC-03: Today marker SHALL have role="status" and aria-live="polite".
   ACC-04: Colour coding SHALL NOT be the only means of conveying event type (icons required).
   ACC-05: Contrast ratio SHALL meet WCAG AA standards (4.5:1 for text).
   ACC-06: Hover tooltips SHALL also be accessible via keyboard focus.
   ACC-07: Screen reader users SHALL be able to navigate events chronologically via list view.

8. Performance Requirements
   PERF-01: Timeline SHALL render within 500ms for cases with ≤50 events.
   PERF-02: Lane calculation algorithm SHALL complete within 100ms for ≤100 events.
   PERF-03: Hover interactions SHALL feel instantaneous (<50ms response).
   PERF-04: View mode toggle SHALL not require API refetch.

9. Browser Support

Chrome (latest 2 versions)
Firefox (latest 2 versions)
Safari (latest 2 versions)
Edge (latest 2 versions)
Mobile Safari (iOS 15+)
Chrome Mobile (Android 10+)

10. Out of Scope (Future Enhancements)

Drag-to-reschedule future events
Zoom in/out (week/month/quarter views)
Filter by event type
Swimlanes by party (client/seller/lender)
Print-optimised view
Event creation from timeline
Critical path highlighting

11. Acceptance Checklist
    Time-Proportional View

Events positioned proportionally by date
Today marker visible with date label
Past/future visual distinction on axis
Month background bands displayed
Month labels displayed
Event cards show icon, title, relative time
Event cards colour-coded by type
No event cards overlap (collision avoidance working)
Connector lines link cards to axis
Hover expands card and shows tooltip
Today's event(s) highlighted
Past events have reduced opacity

Compact List View

Events in chronological order
Month headers displayed
TODAY divider positioned correctly
Time gap indicators shown (>3 days)
Full event details visible
Today's event(s) highlighted

General

View toggle works and persists
Summary stats accurate
Empty state handled
Keyboard accessible
Responsive on tablet/mobile
Performance acceptable with 50 events
