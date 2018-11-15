

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import shareButton from './icons/ico_share.png';
import commentButton from './icons/ico_comment.png';
import likeButton from './icons/ico_like.png';


class RightButton extends Component {

    static propTypes = {
        videoId: PropTypes.string.isRequired,       
        numLikes: PropTypes.string.isRequired,
        numComments: PropTypes.string.isRequired,
        numShares: PropTypes.string.isRequired
    }




    //각 버튼을 눌렀을 때 동작. 현재는 내용 없음
    commentBtnClick = () => {
        alert("leave a comment...");
    }

    likeBtnClick = () => {
        alert("I like it!");
    }

    shareBtnClick = () => {
        alert("Share to your neighbors");
    }

   

    render() {

        return (

            //버튼 정의
            <div style={{alignItems: "center"}}>
                 <font color="#ffffff"><b><center>
                    <div style={{alignItems: "center"}}>
                        <img src={likeButton} alt="Like" style={{width: 40, height: 40, marginTop: 20}} /> <br/>
                        {this.props.numLikes}
                    </div>
                    <div style={{alignItems: "center"}}>
                        <img src={commentButton} alt="Comment" style={{width: 40, height: 40, marginTop: 20}} /> <br />
                        {this.props.numComments}
                    </div>
                    <div style={{alignItems: "center"}}>
                        <img src={shareButton} alt="Share" style={{width: 40, height: 40, marginTop: 20}} /> <br />
                    {this.props.numShares}
                </div>
                </center></b></font>
            </div>
        );
    
    }

}

export default RightButton