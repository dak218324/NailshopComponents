import React, { Component } from 'react';
import $ from 'jquery';

var videoFile;
var fr = new FileReader();
var CHUNK_SIZE = 16 * 1024;         //1회 전송당 보내는 데이터 크기. 현재 16KB
var currentChunk = 0;               //전송하고자 하는 chunk
var numChunks = 0;                  //파일 분할수
var uploadAvailable = true;         

class UploadVideo extends Component {


    //업로드 버튼을 누르면 호출
    upload = () => {

        if(videoFile && uploadAvailable) {   //파일을 선택한 상태에서만 전송이 가능
            console.log("[Notice] File Transfer Start");
            uploadAvailable = false;    //업로드 중에 또다른 파일의 업로드를 방지한다.

            //전송을 위한 웹소켓 생성
            var ws = new WebSocket("ws://58.229.163.119:9988");
            //웹소켓 기본 이벤트 등록
            ws.addEventListener('close', () => {
                console.log("[Notice] Websocket Disconnected.");
            })
            ws.addEventListener('error', e => {
                console.log("[Error]: " + e.msg);
            });

            //웹소켓이 open되면 Handshake와 동시에 파일에 대한 기본 데이터 전송
            ws.addEventListener('open', () => {
                var sendingData = new Object();                                        //json object 생성
                sendingData.messageType = "MSG_HANDSHAKE"                              //메시지 타입 전달(서버 측에서 무엇에 관한 메시지인지 알도록 함)
                sendingData.userID = "USER_ID"                                         //유저 아이디 전달
                sendingData.fileSize = videoFile.size;                                 //비디오 파일 크기 전달
                sendingData.numChunks = numChunks;                                     //chunk 개수 정달
                sendingData.extension = videoFile.name.split(".").pop().toLowerCase(); //확장자명 전달
                var jsonData = JSON.stringify(sendingData);                            //위 내용을 json string으로 바꿈                  
                ws.send(jsonData);                                                  //json string 전송
                console.log("[Handshake Info]: " + jsonData);   
            });

            //Handshake 이후 비디오 파일 데이터 전송
            ws.addEventListener('message', e => {
                
                var receivedData = JSON.parse(e.data);
                var message = receivedData.message;

                //서버로부터 전송 시작 메시지를 받으면
                if(message === "MSG_TRANSFER_START") {
                    while(currentChunk < numChunks) {
                        console.log("[Current Chunk]: " + currentChunk);
                        //파일을 분할하여 변수에 저장
                        var sendingData = videoFile.slice(currentChunk * CHUNK_SIZE, Math.min((currentChunk + 1) * CHUNK_SIZE, videoFile.size));     
                        currentChunk ++;            //다음 chunk를 보내기 위한 현재 chunk번호 증가
                        ws.send(sendingData);       //chunk 전송
                    }   
                } else if(message === "MSG_PROGRESS_INFO") {     //서버로부터 전송 진행 사항을 전달받으면

                    var progress = receivedData.currentChunk / numChunks; //전송 정도를 나타내는 0~1 사이의 실수 (0: 0%, 1: 100%)



                    //**TODO**: progress 정보를 이용하여 클라이언트 뷰 업데이트



                    console.log("[In Progress..]: " + (progress * 100) + "% Complete");
                } else if(message === "MSG_TRANSFER_COMPLETE") {  //서버로부터 전송 완료 메시지를 받으면
                    
                    var sendingData = new Object();
                    sendingData.messageType = "MSG_NOTIFY_TRANSFER_COMPLETE";
                    var jsonData = JSON.stringify(sendingData);
                    ws.send(jsonData);                          //파일 전송 서버에 클라이언트 정보 삭제 처리를 위해 최종 메시지 전송
                    var fileName = receivedData.fileName;       //서버에 저장된 실제 파일명
                  


                    //**TODO**: 파일명(fileName) 정보를 동영상 테이블 DB에 저장  
                
                
                    numChunks = 0;
                    currentChunk = 0;       //chunk 정보 초기화
                    uploadAvailable = true; //업로드 제한 해제
                    console.log("[Notice]: File Transfer Complete");
                }
            })
        } else {

            alert("파일을 선택하지 않았거나 업로드 중인 파일이 있습니다.");

            //**TODO**: alert 대신 적절한 클라이언트 뷰 

        }
    }

    componentDidMount() {
        document.getElementById("camera").addEventListener('change', e => {
            this.fileSelector(e);
        
        });

        document.getElementById("video").addEventListener('change', e => {
            this.fileSelector(e);          
        });
    }

    fileSelector = e => {
        if(uploadAvailable) {
            if(e.target.files[0] != null) {
                videoFile = e.target.files[0];
                numChunks = Math.ceil(videoFile.size / CHUNK_SIZE);
                console.log("[Notice]: Video Selected");
            } else {
                console.log("[Notice]: Video Not Selected");
            }
        } else {
            alert("업로드 중인 파일이 있습니다");

            //**TODO**: alert 대신 적절한 클라이언트 뷰 
        }
    }

    render() {

        return (
            <div style={{position:"absolute", width:"100%", height: "100%"}}>

                <span id="uploadArea">
                    <input id="camera" type="file" accept="video/*" capture="camera"></input>

                    <input id="video" type="file" accept="video/*" />

                    <input id="description" type="text" />

                    <input id="register" type="button" onClick={this.upload} />
                </span>
            </div>
        );
    }
}

export default UploadVideo;