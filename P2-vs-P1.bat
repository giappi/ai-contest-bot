pushd Server
start RunServer.bat
popd
pushd Observer
start index.html
popd
pushd Arena

IF EXIST P1.exe (
	start "Bot C++" cmd /c call P1.exe -h 127.0.0.1 -p 3011 -k 30
) ELSE IF EXIST P1.js (
	start P12.bat
) ELSE IF EXIST P1.jar (
	IF EXIST tyrus-standalone-client-1.10.jar (
		start "Bot Java" cmd /c call java -jar P1.jar -h 127.0.0.1 -p 3011 -k 30
	) ELSE (
		echo tyrus-standalone-client-1.10.jar missing. Please copy it to Arena folder.
	)
)


IF EXIST P2.exe (
	start "Bot C++" cmd /c call P2.exe -h 127.0.0.1 -p 3011 -k 11
) ELSE IF EXIST P2.js (
	start P21.bat
) ELSE IF EXIST P2.jar (
	IF EXIST tyrus-standalone-client-1.10.jar (
		start "Bot Java" cmd /c call java -jar P2.jar -h 127.0.0.1 -p 3011 -k 11
	) ELSE (
		echo tyrus-standalone-client-1.10.jar missing. Please copy it to Arena folder.
	)
)
popd
