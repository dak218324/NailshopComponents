

/**
 * Created by seodongmin on 2017-09-26.
 */


import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.io.DataOutputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.util.HashMap;
import java.util.Random;
import javax.xml.bind.DatatypeConverter;
import java.nio.channels.FileChannel;
import java.lang.Math;


import org.json.*;


import org.java_websocket.WebSocket;
import org.java_websocket.WebSocketImpl;
import org.java_websocket.framing.Framedata;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;



public class WebFileTransfer {
	
	//파일 전송에 사용할 포트 번호(클라이언트 파일과 같은 것으로 맞출 것)
	public static final int PORT = 9988;

	public static void main(String[] args) {
		//파일을 전송하는 클라이언트들 정보를 저장
		HashMap<String, ClientElement> clients = new HashMap<String, ClientElement>();
		
		try {
			//서버 소켓 생성 및 시작
			final FileTransferSocket server = new FileTransferSocket(PORT, clients);
			server.start();
		} catch(IOException e) {
			
		}
	}
}


class FileTransferSocket extends WebSocketServer {
	
	
	HashMap<String, ClientElement> clients; //클라이언트 정보를 저장할 HashMap (main으로부터 전달받는다)

    //메시지에 대응하는 상수 선언
	private final int MSG_HANDSHAKE = 1;
	private final int MSG_NOTIFY_TRANSFER_COMPLETE = 2;
	int port;
	
	public FileTransferSocket(int port, HashMap<String, ClientElement> clients) throws UnknownHostException {
		super(new InetSocketAddress(port));
		this.port = port;
		this.clients = clients;
	}
	

	@Override
	public void onClose(WebSocket socket, int code, String reason, boolean remote) {
		InetSocketAddress isaClient = (InetSocketAddress) socket.getRemoteSocketAddress();
		System.out.println("Closed on " + isaClient.getPort());
	}

	@Override
	public void onError(WebSocket socket, Exception e) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onMessage(WebSocket socket, String message) {
		InetSocketAddress isaClient = (InetSocketAddress) socket.getRemoteSocketAddress();
		
		String userID = "";
		String extension = "";
		String messageType = "";
		int numChunks = 0;
		int fileSize = 0;

		String connInfo = String.valueOf(isaClient.getPort());

		try {
			JSONObject jo = new JSONObject(message);

			switch(messageAnalyzer(jo.getString("messageType"))) {

            //클라이언트와 최초 연결시. handshake와 동시에 업로드하고자 하는 파일 정보를 전달받는다.
			case MSG_HANDSHAKE: {

				try {
				jo = new JSONObject(message);
				userID = jo.getString("userID");
				extension = jo.getString("extension");
				numChunks = jo.getInt("numChunks");
				fileSize = jo.getInt("fileSize");
				} catch(JSONException e) {
					System.out.println("JSON Parse Failed...");
				}
                //전달받은 파일 정보를 클라이언트 포트 번호를 key로 하여 HashMap에 저장
				clients.put(connInfo, new ClientElement(socket, connInfo, userID, extension, fileSize, numChunks));
				
				try {
					JSONObject sendingData = new JSONObject();
					sendingData.put("message", "MSG_TRANSFER_START");
					socket.send(sendingData.toString());    //파일 전송을 시작해도 된다는 메시지 전달
				} catch(JSONException e) {
					System.out.println("JSON Creation Failed...(TRANSFER_START)");
				}

				break;
			}

            //파일 전송이 끝난 걸 확인한 클라이언트가 최종적으로 주는 메시지
			case MSG_NOTIFY_TRANSFER_COMPLETE: {
				clients.remove(connInfo);   //HashMap에 저장한 client 정보를 삭제한다.
				System.out.println(connInfo + ": client information successfully removed on file transfer server"); //콘솔 출력
				break;
			}
			}

		} catch(JSONException e) {

		}
		
		
	}
	
	@Override
	public void onMessage(WebSocket socket, final ByteBuffer message) {
		
		final InetSocketAddress isaClient = (InetSocketAddress) socket.getRemoteSocketAddress();
		String connInfo = String.valueOf(isaClient.getPort());
		ClientElement client = clients.get(connInfo);
		client.pushToFile(message.array());
	}

	@Override
	public void onOpen(WebSocket socket, ClientHandshake handshake) {
		// TODO Auto-generated method stub
		System.out.println("File Transfer Server Started.. Listening.. (PORT: " + this.port + ")");
		
	}

    //메시지(String)를 숫자로 변환
	public int messageAnalyzer(String msg) {

		if(msg.equals("MSG_HANDSHAKE")) {
			return MSG_HANDSHAKE;
		} else if(msg.equals("MSG_NOTIFY_TRANSFER_COMPLETE")) {
			return MSG_NOTIFY_TRANSFER_COMPLETE;
		} else {
			return -1;
		}
	}
}



class ClientElement {
	private WebSocket socket;			//클라이언트 소켓 정보 저장
	private String connInfo;			//클라이언트 연결 port 정보 저장
	private String userID;				//파일을 전송하는 사용자 ID를 저장
	private String fileName;			//서버에 저장되는 실제 파일명을 저장
	private int numChunks;				//파일 전체 chunk수를 저장
	private int currentChunk;			//현재 전송중인 chunk를 저장
	private int fileSize;				//파일 크기 저장
	private String extension;			//파일 확장자 저장
	private FileOutputStream fos;		//파일 output stream
	private long startedTime;			//전송이 시작된 시간을 기록
	
	public ClientElement(WebSocket socket, String connInfo, String userID, String extension, int fileSize, int numChunks) {
		this.socket = socket;
		this.connInfo = connInfo;
		this.userID = userID;
		this.fileName = userID + "_" + generateRandomString(15); // 이름 형식: 유저ID_랜덤문자열
		this.numChunks = numChunks;
		this.currentChunk = 0;
		this.fileSize = fileSize;
		this.extension = extension;
		this.startedTime = System.currentTimeMillis();      //전송시작시간을 기록
		
		try {
			this.fos = new FileOutputStream(this.fileName + "." + this.extension);
		} catch(FileNotFoundException e) {
			System.out.println(this.connInfo + ": File Creation Failed...");
		}
		
		//파일의 개략적인 정보를 출력
		System.out.println("------Upload File Info------");
		System.out.println("Name: " + this.fileName);
		System.out.println("Ext : " + this.extension);
		System.out.println("Size: " + ((float)this.fileSize / (1024 * 1024)) + "MB");
		System.out.println("----------------------------");
	}

    //클라이언트로부터 전송받은 byte array를 파일에 저장시킨다.
	public void pushToFile(byte[] ba) {

		try {
			fos.write(ba);      //파일에 저장
			
			

            //클라이언트로 전달할 진행상황. 잦은 전송이 일어나지 않도록 하기 위해 파일의 용량을 고려하여 적당한 Chunk 간격으로만 전송되도록 한다.
			if((this.currentChunk == (this.numChunks - 1) || (this.currentChunk + 1) % Math.ceil((float)this.numChunks / 500) == 0) && (this.currentChunk < this.numChunks)) {
				  try {
                    System.out.println(this.connInfo + " Transferring..: " + ((float)(this.currentChunk + 1) * 100 / this.numChunks) + "% Complete"); //진행상황 콘솔출력
					JSONObject sendingData = new JSONObject();
					sendingData.put("message", "MSG_PROGRESS_INFO");
					sendingData.put("currentChunk", this.currentChunk + 1);
					socket.send(sendingData.toString());                //진행상황 전송
				} catch(JSONException e) {
					System.out.println("JSON Creation Failed...(PROGRESS_INFO)");
				}
			}


            //마지막 Chunk를 보낸 뒤 전송이 완료됨을 클라이언트에 알림
			if(this.currentChunk == this.numChunks - 1) {
				try {
					System.out.println("Ellapsed Time: " + (System.currentTimeMillis() - this.startedTime) + " ms");
					System.out.println("Speed        : " + (float)(this.fileSize / 1024) * 1000 / (System.currentTimeMillis() - this.startedTime) + " KB/s" );
					JSONObject sendingData = new JSONObject();
					sendingData.put("message", "MSG_TRANSFER_COMPLETE");
					sendingData.put("fileName", this.fileName);
					socket.send(sendingData.toString());
				} catch(JSONException e) {
					System.out.println("JSON Creation Failed...(TRANSFER_COMPLETE)");
				}
			}

            this.currentChunk ++;    //다음 Chunk
		} catch(IOException e) {
			e.printStackTrace();
		}
	}
	
	//getter
	public String getFileName() {
		return this.fileName;
	}
	
	public String getExtension() {
		return this.extension;
	}
	
	public int getNumChunks() {
		return this.numChunks;
	}
	
	public int getCurrentChunk() {
		return this.currentChunk;
	}
	
	public FileOutputStream getFos() {
		return this.fos;
	}


    //파일 이름에 대한 Random String을 생성. 숫자, 영소문자, 영대문자가 섞인 랜덤 문자열을 length 길이만큼 반환한다
	private String generateRandomString(int length) {
	
		StringBuffer temp = new StringBuffer();
		Random rnd = new Random();
		for (int i = 0; i < length; i++) {
		    int rIndex = rnd.nextInt(3);
		    switch (rIndex) {
		    case 0:
		        // a-z
		        temp.append((char) ((int) (rnd.nextInt(26)) + 97));
		        break;
		    case 1:
		        // A-Z
		        temp.append((char) ((int) (rnd.nextInt(26)) + 65));
		        break;
		    case 2:
		        // 0-9
		        temp.append((rnd.nextInt(10)));
		        break;
		    }
		}
		return temp.toString();
	}
}





