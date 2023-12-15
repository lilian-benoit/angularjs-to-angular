import { TestMigrationPage } from './app.po';

describe('test-migration App', function() {
  let page: TestMigrationPage;

  beforeEach(() => {
    page = new TestMigrationPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
