import { setApplication } from '@ember/test-helpers';
import Application from 'dummy/app';
import config from 'dummy/config/environment';
import { setRunOptions } from 'ember-a11y-testing/test-support';
import { start } from 'ember-qunit';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import 'qunit-dom';

setApplication(Application.create(config.APP));

setup(QUnit.assert);

setRunOptions({
  rules: {
    'scrollable-region-focusable': {
      enabled: false,
    },
  },
});

start();
