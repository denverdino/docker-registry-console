Web Console for Docker Image Registry 
================
This is simple project to browse and manage the private docker image registry


Run from Source Code
-----

**Prerequisite**

Install Node.js [http://nodejs.org/](http://nodejs.org/)

Install Redis [http://redis.io/](http://redis.io/)

**Setup** 

	git clone https://github.com/denverdino/docker-image-registry-console.git
	npm install bower -g
	cd docker-image-registry-console/
	npm install
	bower install
		
**Config** 

Update the config.json according to your environment setting. 

**Run**

    #Start redis server
	redis-server
	
	#Start the web console of Docker registry
	npm start



Run as Docker Container
-----

**Prerequisite** 

Install the docker [https://docs.docker.com/installation/](https://docs.docker.com/installation/)

Install the fig [http://www.fig.sh/](http://www.fig.sh/)

**Config** 

Update the fig.yml according to your environment setting. 
	
	web:
	  build: .
	  links:
	   - redis
	  ports:
	   - "3000:3000"
	  environment:
	    PRIVATE_REGISTRY_URL: http://192.168.199.191:5000
	    DOCKER_HUB_USER: USER_NAME
	    DOCKER_HUB_PASSWORD: PASSWORD
	redis:
	  image: redis:latest


**Run** 	

	fig up



Unit Testing
-----

	npm install nodeunit -g
	nodeunit test

License and Authors
-------------------
Authors: denverdino@gmail.com