import React from 'react';
import {render} from 'react-dom';
import {createStore, combineReducers} from 'redux';
import {Provider} from 'react-redux';
import {Router, Route, IndexRoute, browserHistory} from 'react-router';
import {syncHistoryWithStore, routerReducer} from 'react-router-redux'

import Home from './containers/home';

import * as stores from './stores';
const reducer = combineReducers(stores);
const store = createStore(
    combineReducers({
        ...reducer,
        routing: routerReducer
    }));

// Create an enhanced history that syncs navigation events with the store
const history = syncHistoryWithStore(browserHistory, store);

class Root extends React.Component {
    render() {
        return (
            <div>
                {this.props.children}
            </div>
        );
    }
}

const NoMatch = React.createClass({
    render() {
        return <h3>Route is not found</h3>
    }
});

const Login = React.createClass({
    render() {
        return <h3>Login</h3>
    }
});
const Signup = React.createClass({
    render() {
        return <h3>Signup</h3>
    }
});
const User = React.createClass({
    render() {
        return <h3>User</h3>
    }
});
const Rules = React.createClass({
    render() {
        return <h3>Rules</h3>
    }
});
const Contests = React.createClass({
    render() {
        return <h3>Contests</h3>
    }
});
const Contest = React.createClass({
    render() {
        return <h3>Contest</h3>
    }
});

const pageLoaded = (nextState, transition) => {
    // make sure this function return AS SOON AS POSSIBLE
    setTimeout(() => {
        $ && $.loading && $.loading.hide && $.loading.hide();
    }, 500);
};

render(
    (<Provider store={store}>
        <Router history={history}>
            <Route path="/" component={Root} onEnter={pageLoaded}>
                <IndexRoute component={Home}/>
                <Route path="login" component={Login}/>
                <Route path="signup" component={Signup}/>
                <Route path="me" component={User}/>
                <Route path="rules" component={Rules}/>
                <Route path="contests" component={Contests}>
                    <Route path="/contest/:contestName" component={Contest}/>
                </Route>
            </Route>
            <Route path="*" component={NoMatch}/>
        </Router>
    </Provider>),
    document.getElementById('root')
);