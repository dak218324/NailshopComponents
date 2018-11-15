import React, { Component } from 'react';
import './App.css';
import VideoClipElement from './VideoClipElement';  //비디오 요소. 비디오에 딸린 버튼들을 포함한다.
import muteButton from './icons/ico_mute.png';      //음소거 아이콘 import
import unmuteButton from './icons/ico_unmute.png';   //음소거 해제 아이콘 import



//메인 컴포넌트
class App extends Component {

    //스크롤 접근을 위한 전역변수 정의
    static scrollState = {
        muteState : false,          //음소거 상태
        numOfVideos : 5,            //로드된 영상수
        currentVideoIdx : 0,        //현재 보고 있는 영상 index
        windowSize : 0,             //현재 기기의 viewport 높이
        touchStartTime : 0,         //영상 전환(다른 영상 시청)을 위한 화면 터치시작시간
        touchStartScrollPos : 0,    //영상 전환을 위한 화면 터치 당시의 스크롤 위치
        touchEndScrollPos : 0       //영상 전환을 위한 화면 터치가 종료된 시점에서의 스크롤 우치
    }


    //터치 시작 이벤트
    touchStart = () => {

        //터치 시작시 스크롤 위치 및 현재 시간 기록
        App.scrollState.touchStartScrollPos = window.scrollY;
        App.scrollState.touchStartTime = performance.now();

        //터치 시작시 위, 아래 영상에 대한 로드(load)를 한 다음 일시정지(pause) 상태로 전환. 영상 전환시 버퍼링 발생을 최소화시킨다.
        
        //이전 영상(try~catch 사용 이유: 맨 처음, 맨 끝 영상의 경우 존재하지 않는 idx를 참조하게 되므로,
        //이에 대한 에러가 발생하지 않도록 하기 위함)
        try {
            document.getElementById("video_" + this.getVideId(App.currentVideoIdx - 1)).load();
        } catch {
        }
        try {
            document.getElementById("video_" + this.getVideId(App.currentVideoIdx - 1)).pause();
        } catch {

        //다음 영상
        }
        try {
            document.getElementById("video_" + this.getVideId(App.currentVideoIdx + 1)).load();
        } catch {
        }
        try {
            document.getElementById("video_" + this.getVideId(App.currentVideoIdx + 1)).pause();
        } catch {
        }
    }


    //터치 종료 이벤트(손가락을 뗌)
    touchEnd = () => {
        
        //터치 종료시 스크롤 위치 기록
        App.scrollState.touchEndScrollPos =  window.scrollY;
        //swipe 길이 구하기
        let swipeLength = App.scrollState.touchEndScrollPos - App.scrollState.touchStartScrollPos;
        //window 높이 구하기
        let windowHeight = window.innerHeight; 
        //swipe 속력을 계산.
        // 빠르게 swipe를 한 경우, 이전/다음 영상의 60% 이상이 노출되지 않더라도 영상 전환을 하는 기준점을 마련하기 위해 속력을 구한다.
        let swipeSpeed = Math.abs(swipeLength / (performance.now() - App.scrollState.touchStartTime));

        if(swipeLength === 0) { //터치 시작 지점과 터치 종료 지점이 같은 경우, 여기서는 아무 처리를 하지 않는다.
                                //이 경우, 일시정지 및 재생을 위한 터치이므로 이것에 대한 처리는 VideoClipElement에 맡긴다. 
            return;
        } else {    //swipe 행동

            //다음(이전) 영상으로 넘어가기 위한 조건을 만족하는 경우. 다음(이전) 영상의 60% 이상이 보이도록 swipe를 했거나,
            //swipe 속력이 일정 이상(여기서는 0.14 이용)이 되는 경우에 다음(이전) 영상으로 넘어갈 수 있도록 한다.
            if(Math.abs(swipeLength) > 0.6 * windowHeight || swipeSpeed > 0.14) {

                //넘어가기 전에 보고 있던 영상에 대한 정보를 받아서 재생시간을 0으로 되돌리고 일시정지시킨다.
                var stopping_video = document.getElementById("video_" + this.getVideoId(App.currentVideoIdx));
                stopping_video.currentTime = 0;
                stopping_video.pause();

                if(swipeLength < 0) {   //이전(위에 있는) 영상을 보기 위한 swipe 행동일 경우 index 감소
                    (App.currentVideoIdx > 0) ? App.currentVideoIdx -- : console.log("첫 동영상(현재 idx: " + App.currentVideoIdx + ")"); App.CurrentVideoIdx = 0; 
                    
                } else {                //다음(아래에 있는) 영상을 보기 위한 swipe 행동일 경우 index 증가
                    (App.currentVideoIdx < App.numOfVideos) ? App.currentVideoIdx ++ : console.log("마지막 동영상(현재 idx: " + App.currentVideoIdx + ")"); App.CurrentVideoIdx = (App.numOfVideos - 1); 
                }

                //다음(이전) 영상이 보이도록 스크롤 위치 조정
                this.scrollAnimate(App.currentVideoIdx, windowHeight);
                
                //넘어간 이후의 영상에 대한 정보를 받아서, 그 영상을 재생시킨다.
                var playing_video = document.getElementById("video_" + App.currentVideoIdx);
                playing_video.play();
                console.log("동영상 이동(현재 idx: " + App.currentVideoIdx + ")");
            } else { //다음(이전) 영상으로 넘어가기 위한 조건을 만족하지 못한 경우
                //스크롤 위치를 현재 영상만 보이도록 되돌린다.
                this.scrollAnimate(App.currentVideoIdx, windowHeight);
                console.log("동영상 이동 실패(현재 idx: " + App.currentVideoIdx + ")");
            }
        }

        //swipe 행동 이후 현재 동영상만을 보여주지 않고 화면이 약간 어긋나있는 경우 scrollAnimate 함수를 한 번 더 호출하여 화면 조정을 한다.
        if(window.scrollY % windowHeight != 0) {
           this.scrollAnimate(App.currentVideoIdx, windowHeight);
           console.log("화면 조정(현재 idx: " + App.currentVideoIdx + ")");
        }
    }


    //화면의 부드러운 전환을 위한 애니메이션 함수. y=1+cosx 그래프의 [0, pi] 구간을 기반으로 한 애니메이션으로,
    //처음에는 느리게, 중간 과정에서는 빠르게, 마지막 도달 과정에서는 다시 느리게 스크롤 애니메이션이 진행된다.
    scrollAnimate = (destination, windowHeight) => {
        //destination: 목적 스크롤 위치, windowHeight: 현재 기기의 viewport 높이를 전달받는다

        const   numSteps = 25; 
        const   scrollStep = Math.PI / numSteps;    //pi를 numSteps 수만큼(25) 분할한다.
                
        var     scrollCount = 0,              //현재 단계 명시
                scrollCStepPos,               //현재 단계에서의 스크롤 위치 저장. 단계마다 갱신
                scrollInterval = setInterval( function() {
                    
                    
                    if ( scrollCount < numSteps ) {  //단계 진행
                        scrollCount = scrollCount + 1; 
                        scrollCStepPos = (destination*windowHeight) + (window.scrollY - (destination*windowHeight)) * Math.cos(scrollCount * scrollStep)
                        window.scrollTo( 0, scrollCStepPos );
                    } 
                    else { //단계 종료
                        console.log("clearInterval Called! (scrollCount: " + scrollCount);
                        clearInterval(scrollInterval);   
                    }
                }, 15 ); //15ms 간격으로 애니메이션 진행
    }

    //mute버튼 클릭 동작
    changeMuteState = () => {

        if(App.muteState) { //현재 mute 상태이면 unmute 상태로 전환하고 mute버튼 이미지 변경
            for(var i = 0; i < App.numOfVideos; i ++) {
                document.getElementById("video_" + i).muted = false;
                document.getElementById("image_mute_state").src = muteButton;
                App.muteState = false;

            }
        } else {    //현재 umnute 상태이면~
            for(var i = 0; i < App.numOfVideos; i ++) {
                document.getElementById("video_" + i).muted = true;
                document.getElementById("image_mute_state").src = unmuteButton;
                App.muteState = true;
            }
        }
    }

    //idx를 이용하여 실제 video id를 불러오는 함수. 현재 DB가 없으므로 video id는 idx와 동일하다고 가정하여
    //idx를 그대로 반환. DB가 추가되면 수정되어야 할 함수
    getVideoId = idx => {
        return idx;
    }


    
    render() { 
        //최초 mute 상태로 둔다.
        App.muteState = true;
        //첫 영상을 보여주고 있음을 명시
        App.currentVideoIdx = 0;
        //(DB가 없어서 하드코딩) 불러져 있는 영상의 개수
        App.numOfVideos = 5;

        //VideoClipElement 불러오는 것 DB가 없어서 하드코딩
        return (
            <div>
                
                <div style={{position: 'absolute', width: '100%', height: '100%'}} onTouchStart={this.touchStart} onTouchMove={this.touchMove} onTouchEnd={this.touchEnd}>
                    <VideoClipElement videoId="0"
                        path="http://dak2183242.cafe24.com/one.mp4"
                        thumbnail="http://dak2183242.cafe24.com/one.png"
                        isMuted="muted"
                        isAutoPlay="autoPlay"
                        showingOrder={0}
                        userNickname="@밍이"
                        description="#네일아트 #마블링"
                        numLikes="1592"
                        numComments="449"
                        numShares="121"
                    />

                    <VideoClipElement videoId="1"
                        path="http://dak2183242.cafe24.com/two.mp4"
                        thumbnail="http://dak2183242.cafe24.com/two.png"
                        isMuted="muted"
                        isAutoPlay=""
                        showingOrder={1}
                        userNickname="@김보라"
                        description="반짝 반짝 빛나는 탄이들~♡ #방탄소년단 #네일아트 #bt21 #bts"
                        numLikes="31"
                        numComments="9"
                        numShares="0"
                    />

                    <VideoClipElement videoId="2" 
                        path="http://dak2183242.cafe24.com/three.mp4"
                        thumbnail="http://dak2183242.cafe24.com/three.png"
                        isMuted="muted"
                        isAutoPlay=""
                        showingOrder={2}
                        userNickname="@사이다 예린"
                        description="#네일아트 아는 이모가 해주셨어용! 이쁘죵! >~<!!??"
                        numLikes="42.1K"
                        numComments="3295"
                        numShares="412"
                    />

                    <VideoClipElement videoId="3"
                        path="http://dak2183242.cafe24.com/four.mp4"
                        thumbnail="http://dak2183242.cafe24.com/four.png"
                        isMuted="muted"
                        isAutoPlay=""
                        showingOrder={3}
                        userNickname="@뷰티갱"
                        description="요즘핫하다는 유리조각네일이에요~ 이쁘다고 생각하시는 분들은 댓글남겨주세요 #네일 #nail #nailart #손재주프로젝트"
                        numLikes="21.8K"
                        numComments="1024"
                        numShares="220"
                    />

                    <VideoClipElement videoId="4"
                        path="http://dak2183242.cafe24.com/five.mp4"
                        thumbnail="http://dak2183242.cafe24.com/five.png"
                        isMuted="muted"
                        isAutoPlay=""
                        showingOrder={4}
                        userNickname="@뷰티갱"
                        description="이런아트 어떤가유? #네일 #nail #네일아트 #nailart #손재주프로젝트"
                        numLikes="10.9K"
                        numComments="902"
                        numShares="180"
                    />
                </div>
                <img id="image_mute_state" src={unmuteButton} alt="MuteState"
                    style={{position: 'fixed', width: '3.5rem', height: '2.8rem', top: '1rem', right: '1rem'}}
                    onClick={this.changeMuteState} />
            </div>
            
        );
    }
}

export default App