import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { LocaleService } from 'app/modules/language/locale.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { CronDeleteDialog } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronListComponent } from 'app/pages/system/advanced/cron/cron-list/cron-list.component';
import { TaskService } from 'app/services/task.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('CronListComponent', () => {
  let spectator: Spectator<CronListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const cronJobs = [
    {
      id: 1,
      user: 'root',
      command: "echo 'Hello World'",
      description: 'test',
      enabled: true,
      stdout: true,
      stderr: false,
      schedule: {
        minute: '0',
        hour: '0',
        dom: '*',
        month: '*',
        dow: '*',
      },
    },
  ];

  const createComponent = createComponentFactory({
    component: CronListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
      IxTableColumnsSelectorComponent,
      IxTableDetailsRowDirective,
      IxTableDetailsRowComponent,
    ],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectSystemConfigState,
            value: {},
          },
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
      mockApi([
        mockCall('cronjob.query', cronJobs),
        mockCall('cronjob.run'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
      }),
      mockProvider(SlideInRef, { close: jest.fn(), getData: jest.fn((): undefined => undefined) }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(LocaleService),
      mockProvider(TaskService, {
        getTaskNextTime: jest.fn(() => new Date(new Date().getTime() + (25 * 60 * 60 * 1000))),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Users', 'Command', 'Description', 'Schedule', 'Enabled'],
      ['root', "echo 'Hello World'", 'test', '0 0 * * *', 'Yes'],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to add new cronjob when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(CronFormComponent);
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    await table.expandRow(0);

    const runNowButton = await loader.getHarness(MatButtonHarness.with({ text: 'Run Now' }));
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      message: 'Run this job now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cronjob.run', [1]);
  });

  it('shows form to edit an existing interface when Edit button is pressed', async () => {
    await table.expandRow(0);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      CronFormComponent,
      { data: expect.objectContaining(cronJobs[0]) },
    );
  });

  it('deletes a cronjob with confirmation when Delete button is pressed', async () => {
    await table.expandRow(0);

    const deleteIcon = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteIcon.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(CronDeleteDialog, {
      data: expect.objectContaining({ id: 1 }),
    });
  });
});
