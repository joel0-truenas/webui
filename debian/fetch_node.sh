#!/bin/sh -ex
# Download per-built nodejs binary from upstream and place in paths that yarn
# expects to find it. This script is called from within scale-build to prevent
# accidental changes to host OS if developer tries to build the debian package
# outside of a chroot environment.

# Update VERSION below to switch nodejs versions
VERSION=v22.17.1

# shasums can be downloaded from https://nodejs.org/dist/${VERSION}/SHASUMS256.txt
# checksum changes without version change should be investigated.

if [ "$(uname -m)" = "aarch64" ];
then
    PLATFORM=linux-arm64
    SHA256SUM="a5bb879af2fe70e7b5dc5e0bbadecba88e87f45bd8e62c0c57b5c815a4cbbaa6"
else
    PLATFORM=linux-x64
    SHA256SUM="ff04bc7c3ed7699ceb708dbaaf3580d899ff8bf67f17114f979e83aa74fc5a49"
fi

wget https://nodejs.org/dist/${VERSION}/node-${VERSION}-${PLATFORM}.tar.xz

# validate shasum of prebuilt nodejs
echo -n "${SHA256SUM} node-${VERSION}-${PLATFORM}.tar.xz" | sha256sum -c -
RETURN=$?

if [ $RETURN -ne 0 ];
then
    # Failing here will cause `yarn install` to fail due to missing nodejs in
    # scale-build, and so further error handling in this script is not required.
    echo "checksum validation failed!"
    exit ${RETURN}
fi

tar -xvf node-${VERSION}-${PLATFORM}.tar.xz
mv node-${VERSION}-${PLATFORM}/bin/* /usr/bin/
mv node-${VERSION}-${PLATFORM}/lib/* /usr/lib/
rm -rf node-${VERSION}-${PLATFORM}*
