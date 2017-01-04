import {assign} from 'lodash/object';
import {LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT} from '../actionTypes';

const initialState = {
    id: null,
    loggedIn: false,
    loggingIn: false,
    error: false
};

export default function auth(state = initialState, action = {}) {
    switch (action.type) {
        case LOGIN_REQUEST:
            return assign({}, initialState, {loggingIn: true});
        case LOGIN_SUCCESS:
            return assign({}, initialState, action.payload, {loggedIn: true});
        case LOGIN_FAILURE:
            return assign({}, initialState, {error: true});
        case LOGOUT:
            return initialState;
        default:
            return state;
    }
}