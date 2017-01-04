import React from 'react';
import {Link} from 'react-router';

export default class Footer extends React.Component {
    render() {
        return (
            <footer className="footer">
                <div className="container">
                    <nav className="pull-left">
                        <ul>
                            <li>
                                <Link to="/">编程挑战赛</Link>
                            </li>
                            <li>
                                <a href="http://cn.grapecity.com/aboutus/default.htm" target="_blank">关于葡萄城</a>
                            </li>
                            <li>
                                <a href="http://cn.grapecity.com/career/default.htm" target="_blank">工作机会</a>
                            </li>
                        </ul>
                    </nav>
                    <div className="copyright pull-right">
                        &copy; 2016, GrapeCity inc.
                    </div>
                </div>
            </footer>
        );
    }
};