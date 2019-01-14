set -e

usage () { 
    echo "Usage : $0 -s <stage>"
}

# Get STAGE configuration from command line.
while getopts ":s:" opts; do
    case ${opts} in
        s) STAGE=${OPTARG} ;;
        *) break ;;
    esac
done

# Removes the parsed command line opts
shift $((OPTIND-1))

if [ -z "${STAGE}" ]; then
  usage
  exit 1
fi

echo "Deploying frontend stack to ${STAGE}"

# build client
cd client
export BUILD_ENV=$STAGE
node prepEnv.js
node ./node_modules/@vue/cli-service/bin/vue-cli-service.js build

# get to main dir
cd ..

# rename config
cp serverless_frontend.yml serverless.yml

# deploy
export SLS=./node_modules/.bin/serverless

$SLS client deploy --stage="$STAGE"

rm serverless.yml
echo "DO NOT USE\n" > serverless.yml
