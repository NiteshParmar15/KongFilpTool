FROM node:12.20

# Create app directory 
RUN mkdir /src 

WORKDIR /src

ADD package.json /src/package.json

# Install app dependencies
RUN npm install

COPY . /src

EXPOSE 3001

CMD npm start