import React, { Component } from 'react';
import PropTypes from 'prop-types';
import RightButton from './RightButton'                //영상 우측 버튼은 따로 컴포넌트를 구성

class VideoClipElement extends Component {

    static propTypes = {
        videoId: PropTypes.string.isRequired,           //video id
        path: PropTypes.string.isRequired,              //영상 경로
        thumbnail: PropTypes.string.isRequired,         //영상 섬네일
        isMuted: PropTypes.string.isRequired,           //최초 음소거 상태
        isAutoPlay: PropTypes.string.isRequired,        //최초 자동재생 상태
        userNickname: PropTypes.string.isRequired,      //영상 업로더 닉네임
        description: PropTypes.string,                  //영상 설명
        numLikes: PropTypes.string.isRequired,          //영상 좋아요수
        numComments: PropTypes.string.isRequired,       //영상 댓글수
        numShares: PropTypes.string.isRequired,         //영상 공유수
        showingOrder: PropTypes.number.isRequired,      //영상 index
    }

    //영상을 터치했을 때 재생/일시정지를 하도록 한다
    videoPlayPause = id => {
        var video = document.getElementById("video_" + id);
        if(video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }

    render() {
    return ( 
        <div style={{position: 'absolute', top: (this.props.showingOrder) * 100 + '%', left: 0, width: '100%', height: '100%'}}>

            <div className="VideoClipComponent"
                style={{position: 'absolute', width: '100%', height: '100%'}}
                onClick={e => this.videoPlayPause(this.props.videoId)}>    
                        
                <video id={"video_" + this.props.videoId} 
                    preload="auto"
                    autoPlay={this.props.isAutoPlay}
                    muted={this.props.isMuted}
                    playsInline
                    loop
                    poster={this.props.thumbnail}
                    width="100%"
                    height="100%" >


                    <source src={this.props.path} type="video/mp4"/>
                
                </video>
            </div>

          
           <div className="descriptionContainer"
                style={{position: 'absolute', left: '1.0rem', bottom: '5%', marginRight: '25%'} }>
                <font color="white">
                <b>{this.props.userNickname}</b><br/>
                {this.props.description}</font>
            </div>

          
            <div className="RightButtonContainer" 
                style={{position: 'absolute', right: 20, bottom: '15%'}}>
                    
                <RightButton videoId={this.props.videoId}
                    numLikes={this.props.numLikes}
                    numComments={this.props.numComments}
                    numShares={this.props.numShares}
                />
            
            </div>
        </div> 
    );
    }
}


export default VideoClipElement
