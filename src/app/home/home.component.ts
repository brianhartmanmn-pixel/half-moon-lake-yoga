import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
// Import Angular Material Modules for UI components
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

// Re-declare interfaces/types required by this component
export interface YogaClass {
  id: string;
  attendees: string[];
  date: any;
  isCanceled: boolean;
  location: string;
}

// Helper to check if two Dates (or Firebase Timestamps) represent the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  @Input() classes: YogaClass[] = [];
  @Output() selectClass = new EventEmitter<string>();

  // --- Calendar State & Properties ---

  private today = new Date();
  // Initialized to November 2025 to show the class from the database example.
  currentMonth = signal<Date>(new Date(2025, 10, 1)); 

  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  displayMonth = computed(() => {
    return this.currentMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  calendarDays = computed(() => {
    const date = this.currentMonth();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); 

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendar: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    // 1. Add preceding padding days (null for empty cells)
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // 2. Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      currentWeek.push(currentDate);

      if (currentWeek.length === 7) {
        calendar.push(currentWeek);
        currentWeek = [];
      }
    }

    // 3. Add trailing padding days
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) {
      calendar.push(currentWeek);
    }

    return calendar;
  });

  // --- Navigation Methods ---

  previousMonth(): void {
    this.currentMonth.update(date => {
      return new Date(date.getFullYear(), date.getMonth() - 1, 1);
    });
  }

  nextMonth(): void {
    this.currentMonth.update(date => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    });
  }

  // --- Utility Methods ---

  isToday(day: Date | null): boolean {
    if (!day) return false;
    return isSameDay(day, this.today);
  }

  getClassesForDay(day: Date): YogaClass[] {
    if (!day) return [];
    // cls.date is a Firebase Timestamp, so we use .toDate() for comparison
    return this.classes.filter(cls => {
      const classDate: Date = cls.date.toDate();
      return isSameDay(classDate, day);
    });
  }

  handleDayClick(cls: YogaClass[]): void {
    // Navigate to sign-up for the first non-canceled class found on that day.
    const activeClass = cls.find(c => !c.isCanceled);
    if (activeClass) {
        this.selectClass.emit(activeClass.id);
    }
  }

  // Existing class formatting methods
  formatDate(timestamp: any): string {
    return timestamp.toDate().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  formatTime(timestamp: any): string {
    return timestamp.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}