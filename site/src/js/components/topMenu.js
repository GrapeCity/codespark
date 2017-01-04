import React from 'react';
import {Link} from 'react-router';

export default class TopMenu extends React.Component {
    render() {
        return (
            <nav className="navbar navbar-transparent navbar-fixed-top navbar-color-on-scroll">
                <div className="container">
                    <div className="navbar-header">
                        <button type="button" className="navbar-toggle" data-toggle="collapse"
                                data-target="#navigation-index">
                            <span className="sr-only">Toggle navigation</span>
                            <span className="icon-bar"></span>
                            <span className="icon-bar"></span>
                            <span className="icon-bar"></span>
                        </button>
                        <a href="#">
                            <div className="logo-container">
                                <div className="logo">
                                    <img src="img/logo.png" alt="GrapeCity Logo"/>
                                </div>
                            </div>
                        </a>
                    </div>

                    <div className="collapse navbar-collapse" id="navigation-index">
                        <ul className="nav navbar-nav navbar-right">
                            <li>
                                <Link to="/contests" className="right-separator">
                                    编程挑战赛
                                </Link>
                            </li>
                            <li>
                                <Link to="/rules" className="right-separator">
                                    规则和注意事项
                                </Link>
                            </li>
                            <li>
                                <a rel="tooltip" title="<img src='/img/grapecityxianqr.png' alt='微信'>"
                                   data-placement="bottom" data-html="true" target="_blank"
                                   className="btn btn-white btn-simple btn-just-icon">
                                    <i className="fa fa-wechat"></i>
                                </a>
                            </li>
                            <li>
                                <a rel="tooltip" title="关注葡萄城官方微博" data-placement="bottom"
                                   href="http://www.weibo.com/powertools" target="_blank"
                                   className="btn btn-white btn-simple btn-just-icon">
                                    <i className="fa fa-weibo"></i>
                                </a>
                            </li>
                            <li>
                                <a rel="tooltip" title="葡萄城控件技术团队博客" data-placement="bottom"
                                   href="http://powertoolsteam.cnblogs.com/" target="_blank"
                                   className="btn btn-white btn-simple btn-just-icon">
                                    <i className="fa fa-wordpress"></i>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        );
    }
}