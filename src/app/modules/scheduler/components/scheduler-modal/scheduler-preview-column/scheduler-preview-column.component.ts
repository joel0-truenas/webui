import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnChanges,
  OnInit, Signal, viewChild,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCalendar, MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { MatDialogClose } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  getDate, isBefore,
  startOfMonth, differenceInCalendarMonths,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CronSchedulePreview } from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';
import { SchedulerDateExamplesComponent } from 'app/modules/scheduler/components/scheduler-modal/scheduler-date-examples/scheduler-date-examples.component';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-scheduler-preview-column',
  templateUrl: './scheduler-preview-column.component.html',
  styleUrls: ['./scheduler-preview-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    TestDirective,
    MatDialogClose,
    IxIconComponent,
    MatCalendar,
    SchedulerDateExamplesComponent,
    TranslateModule,
    CrontabExplanationPipe,
  ],
})
export class SchedulerPreviewColumnComponent implements OnChanges, OnInit {
  readonly crontab = input.required<string>();
  readonly timezone = input.required<string>();

  readonly startTime = input<string>();
  readonly endTime = input<string>();

  /**
   * 1 for 1st day of the month, etc.
   */
  highlightedCalendarDays = new Set<number>();

  cronPreview: CronSchedulePreview | null;

  readonly calendar: Signal<MatCalendar<Date>> = viewChild.required('calendar', { read: MatCalendar });

  get startDate(): Date {
    if (!this.calendar().activeDate || differenceInCalendarMonths(this.calendar().activeDate, new Date()) < 1) {
      return toZonedTime(new Date(), this.timezone());
    }

    return startOfMonth(this.calendar().activeDate);
  }

  get isPastMonth(): boolean {
    return isBefore(this.calendar().activeDate, startOfMonth(new Date()));
  }

  ngOnChanges(): void {
    this.updatePreviewDates();
    this.refreshCalendar();
  }

  ngOnInit(): void {
    this.calendar().stateChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onCalendarUpdated());
  }

  getSelectedDateClass: MatCalendarCellClassFunction<Date> = (dateInCalendar): string => {
    const dayNumber = getDate(dateInCalendar);
    if (this.highlightedCalendarDays.has(dayNumber)) {
      return 'highlighted-date';
    }

    return '';
  };

  private onCalendarUpdated(): void {
    this.updatePreviewDates();
  }

  private updatePreviewDates(): void {
    if (this.isPastMonth) {
      this.cronPreview = null;
      this.highlightedCalendarDays = new Set();
      return;
    }

    try {
      this.cronPreview = new CronSchedulePreview({
        crontab: this.crontab(),
        startTime: this.startTime(),
        endTime: this.endTime(),
      });

      this.highlightedCalendarDays = this.cronPreview.getNextDaysInMonthWithRuns(this.startDate);
    } catch (error: unknown) {
      console.error(error);
    }
  }

  private refreshCalendar(): void {
    if (!this.calendar().monthView) {
      return;
    }

    this.calendar().updateTodaysDate();
  }
}
