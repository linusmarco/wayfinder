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

echo "Serving frontend pointed to ${STAGE}"

# build client
cd client
export BUILD_ENV=$STAGE
node prepEnv.js
node ./node_modules/@vue/cli-service/bin/vue-cli-service.js serve
