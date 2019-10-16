import React from "react";
import PropTypes from "prop-types";
import { Tabs, Icon } from "antd";
import { Main } from "./AppLayout/Main";
import { Snippets } from "./AppLayout/Snippets";
import { SettingsPanel } from "./AppLayout/Settings/SettingsPanel";
import { VariablesPane } from "./AppLayout/Project/Variables/VariablesPane";
import { GitPane } from "./AppLayout/Project/Git/GitPane";
import { TestReport } from "./AppLayout/TestReport";
import ErrorBoundary from "component/ErrorBoundary";
import { confirmUnsavedChanges } from "service/smalltalk";

const TabPane = Tabs.TabPane;

export class TabGroup extends React.Component {

  static propTypes = {
    action:  PropTypes.shape({
      removeAppTab: PropTypes.func.isRequired,
      setAppTab: PropTypes.func.isRequired,
      saveSuite: PropTypes.func.isRequired,
      setSuite: PropTypes.func.isRequired
    }),
    store: PropTypes.object.isRequired,
    selector: PropTypes.object
  }

  onEdit = ( targetKey, action ) => {
    this[ action ]( targetKey );
  }

  onChange = ( targetKey ) => {
    this.props.action.setAppTab( targetKey );
  }

  remove = async ( targetKey ) => {
    if ( targetKey === "suite" && this.props.store.suite.modified ) {
      await confirmUnsavedChanges({
        saveSuite: this.props.action.saveSuite,
        setSuite: this.props.action.setSuite
      });
    }
    this.props.action.removeAppTab( targetKey );
  }

  render() {
    const { store, action, selector } = this.props,
          { tabs } = store.app,
          { suite } = store,

          suiteTabTitle = suite.filename
            ? ( store.suite.snippets
              ? "Snippets"
              : <span><Icon title={ "Suite: " + suite.title } type="container" />{ suite.filename }</span> )
            : "Loading..." ,

          panes = {

            suite: () => ( <TabPane tab={ suiteTabTitle } key="suite" closable={ true }>
              { store.suite.snippets && <Snippets action={ action } store={ store } selector={ selector } /> }
              { !store.suite.snippets && <Main
                action={ action }
                selector={ selector } /> }
            </TabPane> ),

            testReport: () => ( <TabPane tab="Test report"
              key="testReport" closable={ true } className="report-panel-tab">
              <TestReport
                action={ action }
                targets={ store.suite.targets }
                projectDirectory={ store.settings.projectDirectory }
                headless={ store.app.headless }
                launcherArgs={ store.app.launcherArgs }
                checkedList={ store.app.checkedList }
                environment={ store.app.environment }
                options={{
                  updateSnapshot: store.app.updateSnapshot,
                  interactiveMode: store.app.interactiveMode,
                  incognito: store.app.incognito,
                  ignoreHTTPSErrors: store.app.ignoreHTTPSErrors
                }}
                project={ store.project }
                snippets={ store.snippets }
                selector={ selector }
              />
            </TabPane> ),

            projectVariables: () => ( <TabPane tab={ "Variables" } key="projectVariables" closable={ true }>
              <div className="tabpane-frame"><VariablesPane /></div>
            </TabPane> ),

            projectGit: () => ( <TabPane tab={ "GIT" } key="projectGit" closable={ true }>
              <div className="tabpane-frame">
                <GitPane action={ action } git={ store.git } projectDirectory={ store.settings.projectDirectory } />
              </div>
            </TabPane> ),

            settings: () => ( <TabPane tab={ "Settings" } key="settings" closable={ true }>
              <SettingsPanel
                action={ action }
                settings={ store.settings }
                project={ store.project }
              />
            </TabPane> )
          };

    return (
      <ErrorBoundary>
        <Tabs
          className="c-tab-group-suite"
          hideAdd={ true }
          animated={ false }
          type="editable-card"
          activeKey={ tabs.active || "" }
          onChange={ this.onChange }
          onEdit={ this.onEdit }
        >

          { Object.keys( tabs.available )
            .filter( key => tabs.available[ key ])
            .map( key => panes[ key ]() ) }

        </Tabs>
      </ErrorBoundary>
    );
  }

}