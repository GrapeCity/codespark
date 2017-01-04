import React from 'react';
import {Link} from 'react-router';

import TopMenu from '../components/topMenu';
import Footer from '../components/footer';

class Home extends React.Component {
    render() {
        return (
            <div>
                <TopMenu />
                <div className="wrapper">
                    <div className="header header-filter"
                         style={{backgroundImage: "url('img/bg2.jpg')"}}>
                        <div className="container">
                            <a id="contest" name="contest"></a>
                            <div className="row">
                                <div className="col-md-8 col-md-offset-2">
                                    <div className="brand">
                                        <h1>编程挑战赛</h1>
                                        <h3><img src="img/grapecityxian.png" height="48" alt="西安葡萄城信息技术有限公司"/></h3>
                                        <div className="text-center">
                                            <Link to="/contests" className="btn btn-lg btn-success">
                                                <span style={{fontSize: 'large'}}>参与挑战</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="main main-raised">
                        <div className="section section-basic">
                            <div className="container">
                                <div className="title">
                                    <h2><i className="fa fa-paragraph"></i> 最新战报:
                                        <small>2017年新年挑战赛</small>
                                    </h2>
                                </div>

                                <div className="row">
                                    <div className="col-lg-3 col-md-6 col-sm-6">
                                        <div className="card card-stats">
                                            <div className="card-header" data-background-color="orange">
                                                <i className="fa fa-tasks"></i>
                                            </div>
                                            <div className="card-content">
                                                <p className="category">挑战题数</p>
                                                <h3 className="title">10
                                                    <small>道</small>
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6 col-sm-6">
                                        <div className="card card-stats">
                                            <div className="card-header" data-background-color="purple">
                                                <i className="fa fa-user"></i>
                                            </div>
                                            <div className="card-content">
                                                <p className="category">参与人数</p>
                                                <h3 className="title">79
                                                    <small>人</small>
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6 col-sm-6">
                                        <div className="card card-stats">
                                            <div className="card-header" data-background-color="red">
                                                <i className="fa fa-trophy"></i>
                                            </div>
                                            <div className="card-content">
                                                <p className="category">最高分</p>
                                                <h3 className="title">892/
                                                    <small>1000</small>
                                                </h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-3 col-md-6 col-sm-6">
                                        <div className="card card-stats">
                                            <div className="card-header" data-background-color="blue">
                                                <i className="fa fa-calendar"></i>
                                            </div>
                                            <div className="card-content">
                                                <p className="category">下一场</p>
                                                <h3 className="title">2017/1/20</h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <a id="rules" name="rules"></a>
                                <div className="space-100">
                                </div>

                                <div className="row text-center">
                                    <div className="col-md-8 col-md-offset-2 text-center">
                                        <h2>规则和注意事项</h2>
                                        <h4>The kit comes with three pre-built pages to help you get started faster. You
                                            can change the
                                            text and images and you're good to go. More importantly, looking at them
                                            will give you a
                                            picture of what you can built with this powerful kit.</h4>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="section section-download">
                            <div className="container">
                                <div id="root" className="row title text-center">
                                </div>

                                <div className="row text-center">
                                    <div className="col-md-8 col-md-offset-2">
                                        <h2>Want more?</h2>
                                        <h4>We've just launched <a
                                            href="http://demos.creative-tim.com/material-kit-pro/presentation.html?ref=utp-freebie"
                                            target="_blank">Material Kit PRO</a>. It has a huge number of components,
                                            sections and
                                            example pages. Start Your Development With A Badass Bootstrap UI Kit
                                            inspired by Material
                                            Design.</h4>
                                    </div>
                                    <div className="col-xs-8 col-xs-offset-2 col-sm-4 col-sm-offset-4">
                                        <a href="http://demos.creative-tim.com/material-kit-pro/presentation.html?ref=utp-freebie"
                                           className="btn btn-upgrade btn-lg" target="_blank">
                                            <i className="material-icons">unarchive</i> Upgrade to PRO
                                        </a>
                                    </div>
                                </div>

                                <div className="row sharing-area text-center">
                                    <h3>Thank you for supporting us!</h3>
                                    <a href="#" className="btn btn-twitter">
                                        <i className="fa fa-twitter"></i>
                                        Tweet
                                    </a>
                                    <a href="#" className="btn btn-facebook">
                                        <i className="fa fa-facebook-square"></i>
                                        Share
                                    </a>
                                    <a href="#" className="btn btn-google-plus">
                                        <i className="fa fa-google-plus"></i>
                                        Share
                                    </a>
                                    <a href="#" className="btn btn-github">
                                        <i className="fa fa-github"></i>
                                        Star
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Footer/>
                </div>
            </div>
        );
    }
}

export default Home;