import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  S3ProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/s3-provider-form/s3-provider-form.component';

describe('S3ProviderFormComponent', () => {
  let spectator: Spectator<S3ProviderFormComponent>;
  let form: IxFormHarness;
  let details: DetailsTableHarness;
  const createComponent = createComponentFactory({
    component: S3ProviderFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
    details = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, DetailsTableHarness);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      access_key_id: '12345678',
      endpoint: 'https://kms-fips.us-west-2.amazonaws.com',
      max_upload_parts: 10000,
      region: 'us-west-2',
      secret_access_key: 'key',
      signatures_v2: true,
      skip_region: false,
    });

    const formValues = await form.getValues();
    expect(formValues).toEqual({
      'Access Key ID': '12345678',
      'Secret Access Key': 'key',
      'Use Signature Version 2': true,
      'Disable Endpoint Region': false,
    });

    const detailValues = await details.getValues();
    expect(detailValues).toEqual({
      'Endpoint URL': 'https://kms-fips.us-west-2.amazonaws.com',
      'Maximum Upload Parts': '10000',
      Region: 'us-west-2',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      'Access Key ID': '87654321',
      'Secret Access Key': 'secret',
      'Use Signature Version 2': false,
      'Disable Endpoint Region': true,
    });

    await details.setValues({
      'Maximum Upload Parts': 9000,
      Region: 'us-east-1',
      'Endpoint URL': 'https://new.us-west-2.amazonaws.com',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      access_key_id: '87654321',
      secret_access_key: 'secret',

      max_upload_parts: 9000,
      region: 'us-east-1',
      endpoint: 'https://new.us-west-2.amazonaws.com',

      signatures_v2: false,
      skip_region: true,
    });
  });
});
